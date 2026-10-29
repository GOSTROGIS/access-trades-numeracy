"""Check the published exercise PDF against its HTML exercise inventory.

Run: python source/book/test-exercise-forms.py
Requires PyMuPDF. Tests use temporary PDF copies; published files are read only.
For HTML persistence checks, run test-fillable-web.py in the same directory.
"""
from __future__ import annotations

from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile

import fitz

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / 'books/ACCESS-Trades-Numeracy-Exercise-Book-web.html'
PDF = ROOT / 'books/ACCESS-Trades-Numeracy-Exercise-Book.pdf'


class ExerciseInventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current = None
        self.number = False
        self.ids = set()
        self.questions = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if 'ws-head' in classes:
            self.current = attrs['id']
        elif 'who' in classes and self.current:
            self.ids.update('response-' + self.current + '-' + kind for kind in ['name', 'date'])
        elif 'pn' in classes:
            self.number = True

    def handle_data(self, value):
        if self.number and value.strip():
            assert self.current and value.strip().isdigit()
            base = 'response-' + self.current + '-q-' + value.strip()
            self.ids.update(base + '-' + kind for kind in ['answer', 'working'])
            self.questions += 1
            self.number = False


def check_pdf(inventory):
    doc = fitz.open(PDF)
    assert not doc.is_encrypted
    found = set()
    current_sets = set()
    mapped = 0
    samples = {}
    with tempfile.TemporaryDirectory(prefix='exercise-forms-') as temp:
        for page in doc:
            explicit = set(re.findall(r'\bEXERCISE\s+([1-9]\d*[A-Z]|[AB]\d+)\b', page.get_text(), re.I))
            if explicit:
                current_sets = explicit
            numbers = [s for block in page.get_text('dict')['blocks']
                       for line in block.get('lines', []) for s in line['spans']
                       if s['text'].strip().isdigit() and 'Archivo' in s['font'] and abs(s['size'] - 11) < .05]
            words = [w for w in page.get_text('words') if w[4] not in ['WORKING', 'Answer', 'Name', 'Date']]
            for field in page.widgets() or []:
                assert field.field_name not in found, 'Duplicate field: ' + field.field_name
                found.add(field.field_name)
                assert field.field_type == fitz.PDF_WIDGET_TYPE_TEXT
                assert not field.field_flags & 1, 'A response field is read only.'
                assert page.rect.contains(field.rect), field.field_name + ' leaves the page.'
                annotation_flags = int(doc.xref_get_key(field.xref, 'F')[1])
                assert annotation_flags & 4, field.field_name + ' will not print.'
                for word in words:
                    rect = fitz.Rect(word[:4])
                    overlap = rect & field.rect
                    assert overlap.is_empty or overlap.get_area() <= .15 * rect.get_area(), field.field_name + ' overlaps printed content: ' + word[4]
                match = re.fullmatch(r'response-ws-(.+?)-(?:q-(\d+)-(answer|working)|(name|date))', field.field_name)
                assert match, field.field_name
                assert match[1] in current_sets, field.field_name + ' is on the wrong exercise set.'
                if match[3] == 'working':
                    assert field.field_flags & fitz.PDF_TX_FIELD_IS_MULTILINE
                    # Check the field against the printed question number, not its creation order.
                    labels = [r for r in page.search_for('WORKING') if abs(r.y0 - field.rect.y0) < 16 and abs(r.x0 - field.rect.x0) < 60]
                    assert labels, field.field_name + ' has no adjacent WORKING label.'
                    label = min(labels, key=lambda r: abs(r.y0 - field.rect.y0))
                    candidates = [s for s in numbers if 5 < label.x0 - s['bbox'][2] < 16 and s['bbox'][1] < field.rect.y0]
                    assert candidates, field.field_name + ' has no printed question label.'
                    nearest = max(candidates, key=lambda s: s['bbox'][1])
                    assert nearest['text'].strip() == match[2], field.field_name + ' is under the wrong question.'
                    mapped += 1
                if field.field_name in {
                    'response-ws-1A-name', 'response-ws-1A-date',
                    'response-ws-1A-q-1-answer', 'response-ws-1A-q-1-working',
                    'response-ws-2C-q-2-answer', 'response-ws-2C-q-2-working',
                    'response-ws-4K-q-1-answer', 'response-ws-A1-q-14-answer',
                    'response-ws-B1-q-40-answer', 'response-ws-B1-q-40-working',
                }:
                    value = 'Check 3 x 4 = 12\nThen divide by 2.' if match[3] == 'working' else '3/4 in'
                    field.field_value = value
                    field.update()
                    samples[field.field_name] = value
        assert found == inventory.ids, {'missing': sorted(inventory.ids - found), 'unexpected': sorted(found - inventory.ids)}
        assert mapped == inventory.questions
        saved = Path(temp) / 'filled-copy.pdf'
        doc.save(saved, deflate=True)
        with fitz.open(saved) as reopened:
            values = {f.field_name: f.field_value for p in reopened for f in p.widgets() or [] if f.field_name in samples}
            assert values == samples, 'Saved PDF responses changed or disappeared.'
        result = {'pages': len(doc), 'fields': len(found), 'questionPositionsChecked': mapped, 'savedResponsesReopened': len(samples)}
    doc.close()
    return result


def main():
    inventory = ExerciseInventory()
    inventory.feed(WEB.read_text())
    report = {'questions': inventory.questions, 'pdf': check_pdf(inventory)}
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
