"""Add saveable AcroForm fields to a paginated exercise-book PDF without reflowing it.

Requires PyMuPDF. The matching HTML supplies stable exercise/question IDs. Original
vector boxes and printed labels supply the field coordinates, so text and diagrams
are never covered. Existing complete forms are left alone, including saved values.
"""
from __future__ import annotations

import argparse
import base64
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile

import fitz


class Inventory(HTMLParser):
    def __init__(self, source: str):
        super().__init__(convert_charrefs=True)
        self.sets: list[str] = []
        self.questions: list[dict] = []
        self.section = None
        self.depth = 0
        self.active = None
        self.active_depth = self.number_depth = self.prompt_depth = None
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        if tag != 'div':
            return
        self.depth += 1
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if 'ws-head' in classes:
            self.section = attrs['id']
            self.sets.append(self.section)
        if 'prob' in classes:
            if not self.section or self.active:
                raise ValueError('An exercise question is missing its section or is nested.')
            self.active = {'section': self.section, 'number': '', 'prompt': ''}
            self.active_depth = self.depth
        if self.active and 'pn' in classes:
            self.number_depth = self.depth
        if self.active and 'pq' in classes:
            self.prompt_depth = self.depth

    def handle_data(self, value):
        if self.active and self.number_depth:
            self.active['number'] += value
        if self.active and self.prompt_depth:
            self.active['prompt'] += value

    def handle_endtag(self, tag):
        if tag != 'div':
            return
        if self.depth == self.number_depth:
            self.number_depth = None
        if self.depth == self.prompt_depth:
            self.prompt_depth = None
        if self.depth == self.active_depth:
            self.active['number'] = self.active['number'].strip()
            self.active['prompt'] = ' '.join(self.active['prompt'].split())
            if not re.fullmatch(r'\d+', self.active['number']):
                raise ValueError('Every question needs its printed number.')
            self.questions.append(self.active)
            self.active = self.active_depth = None
        self.depth -= 1


def field_id(section: str, number: str | None, kind: str) -> str:
    return f'response-{section}' + (f'-q-{number}' if number else '') + f'-{kind}'


def exact_labels(page, text):
    return [r for r in page.search_for(text) if page.get_textbox(r).strip() == text]


def discover(doc, inventory):
    questions, headers = [], []
    for page in doc:
        drawings = page.get_drawings()
        outlines = [d['rect'] for d in drawings if d['type'] in ('s', 'fs')]
        answers = exact_labels(page, 'Answer')
        for label in exact_labels(page, 'WORKING'):
            candidates = [r for r in outlines if r.contains(label) and r.width > 150 and 18 <= r.height < 190]
            if not candidates:
                raise ValueError(f'Working box not found on page {page.number + 1}.')
            box = min(candidates, key=lambda r: r.get_area())
            answer_labels = [r for r in answers if box.contains(r)]
            if len(answer_labels) != 1:
                raise ValueError(f'Expected one answer label in a working box on page {page.number + 1}.')
            answer = answer_labels[0]
            # End the field above its printed underline. A transparent field
            # crossing that line would make the saved answer look struck out.
            rules = [d['rect'] for d in drawings if d['type'] == 'f' and box.contains(d['rect']) and
                     d['rect'].x0 > answer.x1 and 50 < d['rect'].width and 0 < d['rect'].height <= 1 and
                     answer.y0 < d['rect'].y0 < answer.y1]
            if len(rules) != 1:
                raise ValueError(f'Answer underline not found on page {page.number + 1}.')
            rule = rules[0]
            answer_rect = fitz.Rect(rule.x0, answer.y0 - 3, rule.x1, rule.y0 - 0.3)
            if box.height < 28:
                # Ten existing read-the-display tasks use a one-line box. Its
                # working field sits below the left label, beside the answer.
                working_rect = fitz.Rect(box.x0 + 4, label.y1 + 0.1, answer.x0 - 4, box.y1 - 1.5)
            elif box.height < 45:
                # The shortest ordinary boxes have room for one full-size line
                # beside WORKING, without crowding the separate answer below.
                working_rect = fitz.Rect(label.x1 + 5, box.y0 + 2, box.x1 - 4, answer_rect.y0 - 0.5)
            else:
                working_rect = fitz.Rect(box.x0 + 4, label.y1 + 0.5, box.x1 - 4, answer_rect.y0 - 0.5)
            if working_rect.height < 8 or answer_rect.height < 9:
                raise ValueError(f'Field too short on page {page.number + 1}.')
            questions.append({'page': page.number, 'box': box, 'working': working_rect, 'answer': answer_rect})
        names, dates = exact_labels(page, 'Name'), exact_labels(page, 'Date')
        for name in names:
            pairs = [r for r in dates if abs(name.x0 - r.x0) < 1 and 15 < r.y0 - name.y0 < 40]
            for date in pairs:
                containers = [r for r in outlines if r.width > 400 and r.height < 140 and r.contains(name) and r.contains(date)]
                if not containers:
                    continue
                fields = {}
                for kind, label in [('name', name), ('date', date)]:
                    rules = [d['rect'] for d in drawings if d['type'] == 'f' and
                             abs(d['rect'].x0 - label.x0) < 1 and 70 < d['rect'].width < 160 and
                             0 < d['rect'].height <= 1 and label.y1 < d['rect'].y0 < label.y1 + 22]
                    if len(rules) != 1:
                        raise ValueError(f'{kind} line not found on page {page.number + 1}.')
                    rule = rules[0]
                    fields[kind] = fitz.Rect(rule.x0, label.y1 + 0.2, rule.x1, rule.y0 + 0.2)
                headers.append({'page': page.number, **fields})
    if len(questions) != len(inventory.questions) or len(headers) != len(inventory.sets):
        raise ValueError(f'PDF/HTML inventory differs: {len(questions)}/{len(inventory.questions)} questions, '
                         f'{len(headers)}/{len(inventory.sets)} exercise headings.')
    return questions, headers


def add_field(page, name, tooltip, rect, multiline=False):
    widget = fitz.Widget()
    widget.field_name = name
    widget.field_label = tooltip
    widget.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    widget.field_value = ''
    widget.rect = rect
    widget.text_font = 'Helv'
    # Working areas have fixed, readable type and can scroll for longer methods.
    # Answers and names use viewer auto-fitting to keep longer values visible.
    widget.text_fontsize = min(10, max(6.5, (rect.height - 2) / 1.35)) if multiline else 0
    widget.text_color = (0.08, 0.08, 0.08)
    widget.border_width = 0
    widget.border_color = None
    widget.fill_color = None
    widget.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE if multiline else 0
    annotation = page.add_widget(widget)
    # Printable, editable, exportable standard form fields. No JavaScript,
    # security restriction, or custom save action is needed for PDF-reader Save.
    page.parent.xref_set_key(annotation.xref, 'F', str(fitz.PDF_ANNOT_IS_PRINT))
    # The high-level PyMuPDF Widget API accepts only Base-14 font aliases.
    # Set the standard PDF default appearance directly to the embedded full
    # Unicode font, so a form-capable reader can type mathematical symbols.
    page.parent.xref_set_key(annotation.xref, 'DA', fitz.get_pdf_str(
        f'0.08 0.08 0.08 rg /ExerciseForm {widget.text_fontsize:g} Tf'))


def form_font(doc):
    # Reuse the full, licensed DejaVu font already shipped for lecture PDFs.
    # Keeping the full font (not a subset) lets later answers add new glyphs.
    root = Path(__file__).resolve().parents[2]
    bundle = root / 'carpentry/intake-142/Quizzes/vendor/pdf-resources.js'
    data = bundle.read_text().split('window.LectureQuizPDFResources=', 1)[1].strip().removesuffix(';')
    font_bytes = base64.b64decode(json.loads(data)['vendor/DejaVuSans.ttf'])
    return doc[0].insert_font(fontname='ExerciseForm', fontbuffer=font_bytes)


def add_save_note(doc):
    title = 'Save your filled copy'
    for page in doc:
        if 'How to use this book' not in page.get_text():
            continue
        if title in page.get_text():
            return page.number + 1
        # The how-to illustration ends well above this existing empty area.
        # Validate it instead of blindly covering content in a future edition.
        rect = fitz.Rect(45, 628, 567, 710)
        content = [fitz.Rect(w[:4]) for w in page.get_text('words')]
        content += [d['rect'] for d in page.get_drawings() if d['rect'].width > 1 and d['rect'].height > 1]
        if any(rect.intersects(r) for r in content):
            raise ValueError('No clear space for the save instructions on the how-to page.')
        page.insert_text((45, 642), title, fontname='hebo', fontsize=12, color=(0.62, 0.07, 0.09))
        text = ('Type in the answer and working fields. Use Save or Download in your PDF reader to keep a filled copy. '
                'Reopen that saved file to continue. Use the working box for longer explanations. '
                'If your browser only offers an empty download, open the PDF in a reader that supports saving forms.')
        remaining = page.insert_textbox(fitz.Rect(45, 652, 567, 710), text, fontname='helv', fontsize=10, lineheight=1.35,
                                       color=(0.1, 0.1, 0.1))
        if remaining < 0:
            raise ValueError('Save instructions did not fit.')
        return page.number + 1
    return None  # Chapter-only builds have no front matter.


def make_fillable(pdf_path: Path, html_path: Path, output: Path):
    inventory = Inventory(html_path.read_text())
    expected = {field_id(q['section'], q['number'], k) for q in inventory.questions for k in ['answer', 'working']}
    expected |= {field_id(s, None, k) for s in inventory.sets for k in ['name', 'date']}
    if len(expected) != len(inventory.questions) * 2 + len(inventory.sets) * 2:
        raise ValueError('Duplicate exercise/question identifiers in the HTML.')
    doc = fitz.open(pdf_path)
    existing = [w.field_name for page in doc for w in (page.widgets() or [])]
    if existing:
        if set(existing) != expected or len(existing) != len(expected):
            raise ValueError('Existing fields do not match this book. Refusing to erase saved answers.')
        if output.resolve() != pdf_path.resolve():
            doc.save(output, garbage=3, deflate=True)
        report = {'pages': len(doc), 'questions': len(inventory.questions), 'exerciseSets': len(inventory.sets),
                  'fields': len(existing), 'existingResponsesPreserved': True}
        doc.close()
        return report
    if not inventory.questions:
        if output.resolve() != pdf_path.resolve():
            doc.save(output)
        report = {'pages': len(doc), 'questions': 0, 'exerciseSets': 0, 'fields': 0}
        doc.close()
        return report
    questions, headers = discover(doc, inventory)
    font_xref = form_font(doc)
    placements = []
    for question, placement in zip(inventory.questions, questions):
        page = doc[placement['page']]
        for kind in ['working', 'answer']:
            name = field_id(question['section'], question['number'], kind)
            tooltip = f"Exercise {question['section'][3:]}, question {question['number']}: {kind}. {question['prompt']}"
            add_field(page, name, tooltip[:1000], placement[kind], kind == 'working')
            placements.append({'name': name, 'page': page.number + 1, 'rect': list(placement[kind])})
    for section, placement in zip(inventory.sets, headers):
        page = doc[placement['page']]
        for kind in ['name', 'date']:
            name = field_id(section, None, kind)
            add_field(page, name, f'Exercise {section[3:]}: {kind}', placement[kind])
            placements.append({'name': name, 'page': page.number + 1, 'rect': list(placement[kind])})
    note_page = add_save_note(doc)
    doc.xref_set_key(doc.pdf_catalog(), 'AcroForm/DR/Font/ExerciseForm', f'{font_xref} 0 R')
    doc.xref_set_key(doc.pdf_catalog(), 'AcroForm/DA', fitz.get_pdf_str('0.08 0.08 0.08 rg /ExerciseForm 10 Tf'))
    doc.need_appearances(False)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix='.pdf', dir=output.parent, delete=False) as temp:
        temp_path = Path(temp.name)
    try:
        doc.save(temp_path, garbage=3, deflate=True)
        doc.close()
        with fitz.open(temp_path) as check:
            names = [w.field_name for p in check for w in (p.widgets() or [])]
            if set(names) != expected or len(names) != len(expected):
                raise ValueError('Saved PDF does not contain every expected field.')
            if check.is_encrypted:
                raise ValueError('The filled book must not be encrypted.')
        temp_path.replace(output)
    finally:
        temp_path.unlink(missing_ok=True)
    with fitz.open(output) as final:
        page_count = len(final)
    return {'pages': page_count, 'pagesWithFields': len({p['page'] for p in placements}),
            'questions': len(questions), 'exerciseSets': len(headers), 'fields': len(placements),
            'saveInstructionsPage': note_page, 'placements': placements}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', required=True, type=Path)
    parser.add_argument('--html', required=True, type=Path)
    parser.add_argument('--output', type=Path, help='Defaults to safely replacing the input PDF.')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    report = make_fillable(args.pdf, args.html, args.output or args.pdf)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != 'placements'}))


if __name__ == '__main__':
    main()
