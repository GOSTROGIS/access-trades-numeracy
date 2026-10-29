"""Validate exercise-book field coverage, geometry, editability, and saved responses.

Run: python source/book/test-fillable-pdf.py
Requires PyMuPDF. Unicode appearance is additionally checked in a form-capable
reader because PyMuPDF Widget.update replaces custom form fonts with Helvetica.
"""
from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import json
import sys

import fitz

sys.dont_write_bytecode = True

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('fillable_pdf', Path(__file__).with_name('fillable-pdf.py'))
forms = importlib.util.module_from_spec(spec)
spec.loader.exec_module(forms)
pdf_path = root / 'books/ACCESS-Trades-Numeracy-Exercise-Book.pdf'
html_path = root / 'books/ACCESS-Trades-Numeracy-Exercise-Book-web.html'
inventory = forms.Inventory(html_path.read_text())
expected = {forms.field_id(q['section'], q['number'], kind)
            for q in inventory.questions for kind in ('answer', 'working')}
expected |= {forms.field_id(section, None, kind)
             for section in inventory.sets for kind in ('name', 'date')}

doc = fitz.open(pdf_path)
assert not doc.is_encrypted
names, working_count = [], 0
for page in doc:
    fields = list(page.widgets() or [])
    for w in fields:
        names.append(w.field_name)
        assert w.field_type == fitz.PDF_WIDGET_TYPE_TEXT
        assert not w.field_flags & (fitz.PDF_FIELD_IS_READ_ONLY | fitz.PDF_FIELD_IS_NO_EXPORT)
        assert int(doc.xref_get_key(w.xref, 'F')[1]) & fitz.PDF_ANNOT_IS_PRINT
        assert page.rect.contains(w.rect) and w.rect.height >= 8 and w.rect.width > 50
        assert '/ExerciseForm ' in doc.xref_get_key(w.xref, 'DA')[1]
        assert w.field_value == '', 'The distributed book must contain blank response fields.'
        if w.field_name.endswith('-working'):
            assert w.field_flags & fitz.PDF_TX_FIELD_IS_MULTILINE
            working_count += 1
    for i, a in enumerate(fields):
        for b in fields[i+1:]:
            assert not a.rect.intersects(b.rect), f'Overlapping fields: {a.field_name}, {b.field_name}'
assert set(names) == expected and len(names) == len(expected)
assert working_count == len(inventory.questions)
font = doc.xref_get_key(doc.pdf_catalog(), 'AcroForm/DR/Font/ExerciseForm')
assert font[0] == 'xref'
font_xref = int(font[1].split()[0])
assert doc.xref_get_key(font_xref, 'Subtype')[1] == '/Type0'
assert doc.xref_get_key(font_xref, 'ToUnicode')[0] == 'xref'
sample = {
    'response-ws-1A-q-1-answer': 'four thousand seventy-two',
    'response-ws-1A-name': 'Sample learner',
    'response-ws-1A-date': '2026-10-29',
    'response-ws-2C-q-2-answer': '6 11/16',
    'response-ws-B1-q-40-working': '125% = 1.25\n1.25 x 48 = 60',
    'response-ws-B1-q-40-answer': '60',
}
for page in doc:
    for w in page.widgets() or []:
        if w.field_name in sample:
            w.field_value = sample[w.field_name]
            w.update()
with tempfile.TemporaryDirectory() as temporary:
    saved = Path(temporary) / 'filled.pdf'
    doc.save(saved, deflate=True)
    doc.close()
    with fitz.open(saved) as reopened:
        values = {w.field_name: w.field_value for p in reopened for w in p.widgets() or [] if w.field_name in sample}
        assert values == sample
    result = forms.make_fillable(saved, html_path, saved)
    assert result['existingResponsesPreserved']
    with fitz.open(saved) as reopened:
        values = {w.field_name: w.field_value for p in reopened for w in p.widgets() or [] if w.field_name in sample}
        assert values == sample, 'An idempotent build must not erase learner responses.'
print(json.dumps({'questions': len(inventory.questions), 'exerciseSets': len(inventory.sets),
                  'fillableFields': len(names), 'workingFields': working_count,
                  'savedResponsesReopened': len(sample), 'existingResponsesPreserved': True,
                  'unicodeFontEmbedded': True}, indent=2))
