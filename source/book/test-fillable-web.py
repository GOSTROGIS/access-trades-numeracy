"""Verify exercise responses, persistence, multi-tab updates, backups and failed saves.

Requires Python Playwright and Chromium. Run from any directory:
  python source/book/test-fillable-web.py --browser /usr/bin/chromium
"""
from __future__ import annotations
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
FIRST = 'response-ws-1A-q-1-answer'
SECOND = 'response-ws-1A-q-2-answer'
WORK = 'response-ws-1A-q-1-working'

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', default='/usr/bin/chromium')
    args = parser.parse_args()
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{server.server_port}/books/ACCESS-Trades-Numeracy-Exercise-Book-web.html'
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=args.browser, headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('!!window.ExerciseBookResponses')
        assert page.evaluate('ExerciseBookResponses.fieldCount') == 1826
        assert page.evaluate('ExerciseBookResponses.questionCount') == 848
        assert page.locator('.response-answer textarea').count() == 848
        assert page.locator('.response-working textarea').count() == 848
        value = 'Four thousand seventy-two · ½ × 2 = 1'
        working = 'Keep <script> as text, never execute it.\n4,000 + 70 + 2 = 4,072.'
        page.locator('#'+FIRST).fill(value)
        page.locator('#'+WORK).fill(working)
        page.reload(wait_until='domcontentloaded')
        assert page.locator('#'+FIRST).input_value() == value
        assert page.locator('#'+WORK).input_value() == working
        page.close()
        page = context.new_page()
        page.goto(url, wait_until='domcontentloaded')
        assert page.locator('#'+FIRST).input_value() == value
        other = context.new_page()
        other.goto(url, wait_until='domcontentloaded')
        other.locator('#'+SECOND).fill('15,308')
        page.wait_for_function('(id)=>document.getElementById(id).value==="15,308"', arg=SECOND)
        page.locator('#'+FIRST).fill('4,072')
        other.wait_for_function('(id)=>document.getElementById(id).value==="4,072"', arg=FIRST)
        backup = page.evaluate('ExerciseBookResponses.snapshot()')
        page.evaluate('data=>ExerciseBookResponses.restore(data)', backup)
        assert page.locator('#'+SECOND).input_value() == '15,308'
        bad = {**backup, 'responses': {'not-a-field': 'bad'}}
        failed = page.evaluate('data=>{try{ExerciseBookResponses.restore(data);return false}catch(e){return true}}', bad)
        assert failed and page.locator('#'+SECOND).input_value() == '15,308'
        # One failed save must not be hidden by a successful update to another field.
        page.evaluate('''() => { window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.endsWith("q-1-answer"))throw new DOMException("Full","QuotaExceededError");return originalSetItem.call(this,k,v)}; }''')
        page.locator('#'+FIRST).fill('unsaved answer')
        page.locator('#'+SECOND).fill('saved second answer')
        assert 'Not saved' in page.locator('.response-save-short').inner_text()
        assert 'could not be saved' in page.locator('#response-status').inner_text()
        page.evaluate('() => { Storage.prototype.setItem=window.originalSetItem; }')
        page.locator('#response-retry').click()
        assert 'Not saved' not in page.locator('.response-save-short').inner_text()
        page.reload(wait_until='domcontentloaded')
        assert page.locator('#'+FIRST).input_value() == 'unsaved answer'
        page.evaluate('localStorage.setItem("unrelated-progress", "preserve")')
        page.once('dialog', lambda dialog: dialog.dismiss())
        page.locator('#response-clear').click()
        assert page.locator('#'+FIRST).input_value() == 'unsaved answer'
        page.once('dialog', lambda dialog: dialog.accept())
        page.locator('#response-clear').click()
        assert page.locator('#'+FIRST).input_value() == ''
        assert page.evaluate('localStorage.getItem("unrelated-progress")') == 'preserve'
        page.evaluate('data=>ExerciseBookResponses.restore(data)', backup)
        page.emulate_media(media='print')
        assert page.locator('#'+WORK).locator('..').locator('.response-print').inner_text() == working
        page.emulate_media(media='screen')
        page.set_viewport_size({'width': 320, 'height': 900})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        assert not errors, errors
        browser.close()
    server.shutdown()
    print(json.dumps({'fields': 1826, 'questions': 848, 'persistence': 'pass', 'multiTab': 'pass',
                      'backupValidation': 'pass', 'failedSaveRetry': 'pass', 'scopedClear': 'pass',
                      'printValues': 'pass', 'mobileWidth': 'pass'}))

if __name__ == '__main__':
    main()
