/* Fillable exercise responses. Embedded in the exercise web edition, with no network dependencies. */
(function () {
  'use strict';
  if (!document.body.classList.contains('wb-exercise') || window.ExerciseBookResponses) return;
  const PREFIX = 'is4s-exercise-book-v1:', FORMAT = 'is4s-exercise-book-responses';
  const BOOK = 'trades-numeracy-exercise-book', fields = new Map(), damaged = new Set(), unsaved = new Set();
  const main = document.getElementById('main');
  let storageError = false, restored = 0, questionCount = 0;
  const make = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };
  const tools = make('section', null, 'response-tools'); tools.id = 'response-tools'; tools.setAttribute('aria-labelledby', 'response-tools-title');
  tools.innerHTML = '<div class="response-tools-head"><h2 id="response-tools-title">Your exercise book</h2><span id="response-count"></span></div>' +
    '<p>Type your answers and working below. They save automatically in this browser. Download a backup to keep a copy or move your work to another browser.</p>' +
    '<div class="response-actions"><button type="button" id="response-backup">Download answers backup</button><label class="response-file" for="response-restore">Restore answers backup<input id="response-restore" type="file" accept=".json,application/json"></label><button type="button" class="response-clear" id="response-clear">Clear all responses</button></div>' +
    '<p id="response-status" role="status" aria-live="polite"></p><button type="button" id="response-retry" hidden>Retry saving</button>';
  main.insertBefore(tools, main.firstChild);
  const status = document.getElementById('response-status'), count = document.getElementById('response-count');
  const brand = document.querySelector('.wbrand'), shortStatus = make('span', '', 'response-save-short');
  if (brand) { brand.href = '#response-tools'; brand.append(shortStatus); }
  function announce(message, failed) {
    if (status.textContent !== message) status.textContent = message;
    status.classList.toggle('response-warning', !!failed);
    shortStatus.textContent = storageError ? 'Not saved · view your work' : damaged.size ? 'Check saved work' : 'Saved work · backups';
    shortStatus.classList.toggle('response-warning', storageError || damaged.size > 0);
    if (brand) brand.title = message;
    document.getElementById('response-retry').hidden = !storageError;
  }
  function progress() {
    let done = 0; fields.forEach(f => { if (f.kind === 'answer' && f.input.value.trim()) done++; });
    count.textContent = done + ' of ' + questionCount + ' answers entered';
  }
  function savedMessage(prefix) {
    if (storageError) announce('Some changes could not be saved in this browser. Keep this page open and download a backup of the responses shown here. Older saved responses may return after reopening.', true);
    else if (damaged.size) announce(damaged.size + ' saved field' + (damaged.size === 1 ? '' : 's') + ' could not be read. Restore a backup or enter those responses again. Other responses are saved.', true);
    else announce(prefix || 'Saved in this browser.');
  }
  function showValue(field, value) {
    field.input.value = value;
    field.print.textContent = value || '\u00a0';
    field.container.classList.toggle('response-has-text', !!value.trim());
  }
  function persist(id) {
    const field = fields.get(id);
    try {
      if (field.input.value) localStorage.setItem(PREFIX + id, JSON.stringify({ value: field.input.value, updatedAt: new Date().toISOString() }));
      else localStorage.removeItem(PREFIX + id);
      damaged.delete(id); unsaved.delete(id); storageError = unsaved.size > 0; return true;
    } catch (_) { unsaved.add(id); storageError = true; return false; }
  }
  function read(id, raw) {
    if (raw === null) return '';
    const entry = JSON.parse(raw), field = fields.get(id);
    if (!entry || typeof entry.value !== 'string' || entry.value.length > field.limit) throw new Error('Invalid saved response.');
    return entry.value;
  }
  function field(id, kind, label, target, promptId) {
    const container = make('div', null, 'response-field response-' + kind), lab = make('label', label);
    const input = make(kind === 'answer' || kind === 'working' ? 'textarea' : 'input');
    const limit = kind === 'working' ? 8000 : kind === 'answer' ? 2000 : kind === 'name' ? 140 : 50;
    const print = make('div', '\u00a0', 'response-print'); print.setAttribute('aria-hidden', 'true');
    input.id = id; input.name = id; input.maxLength = limit;
    input.setAttribute('aria-label', target.getAttribute('data-response-label') + ', ' + label);
    if (promptId) input.setAttribute('aria-describedby', promptId);
    if (input.tagName === 'TEXTAREA') input.rows = kind === 'working' ? 3 : 2;
    else { input.type = 'text'; input.autocomplete = 'off'; if (kind === 'date') input.placeholder = 'YYYY-MM-DD'; }
    lab.htmlFor = id; container.append(lab, input, print); target.append(container);
    const record = { input, print, container, limit, kind }; fields.set(id, record);
    input.addEventListener('input', function () { showValue(record, input.value); persist(id); progress(); savedMessage(); });
    return record;
  }
  let set = null;
  document.querySelectorAll('.paper .ws-head, .paper .prob').forEach(el => {
    if (el.classList.contains('ws-head')) {
      set = el.id;
      const who = el.querySelector('.who');
      if (who) {
        who.replaceChildren(); who.classList.add('response-who'); who.setAttribute('data-response-label', 'Exercise ' + set.replace(/^ws-/, ''));
        field('response-' + set + '-name', 'name', 'Name', who);
        field('response-' + set + '-date', 'date', 'Date', who);
      }
      return;
    }
    if (!set) throw new Error('An exercise is missing its worksheet heading.');
    const number = el.querySelector('.pn').textContent.trim(), key = 'response-' + set + '-q-' + number;
    const prompt = el.querySelector('.pq'); prompt.id = key + '-prompt';
    const work = el.querySelector('.workbox');
    const answer = work.querySelector('.ansrow'); const label = answer ? answer.textContent.trim() : 'Answer';
    work.replaceChildren(); work.removeAttribute('style'); work.classList.add('response-fields');
    work.setAttribute('data-response-label', 'Exercise ' + set.replace(/^ws-/, '') + ', question ' + number);
    field(key + '-answer', 'answer', label || 'Answer', work, prompt.id);
    field(key + '-working', 'working', 'Working / method', work, prompt.id);
    questionCount++;
  });
  // Each field has its own key, so another open tab cannot replace unrelated answers with an old whole-book copy.
  let canRead = true;
  fields.forEach((f, id) => {
    if (!canRead) return;
    let raw;
    try { raw = localStorage.getItem(PREFIX + id); }
    catch (_) { canRead = false; storageError = true; return; }
    try { const value = read(id, raw); showValue(f, value); if (value) restored++; }
    catch (_) { damaged.add(id); }
  });
  progress(); savedMessage(restored ? 'Restored your saved responses. New changes save automatically.' : 'Ready. Your responses will save automatically in this browser.');
  window.addEventListener('storage', function (event) {
    if (event.key === null) {
      fields.forEach((f, id) => { if (!unsaved.has(id)) showValue(f, ''); }); progress(); savedMessage('Saved browser data was cleared in another tab.'); return;
    }
    if (!event.key.startsWith(PREFIX)) return;
    const id = event.key.slice(PREFIX.length), record = fields.get(id); if (!record) return;
    if (unsaved.has(id)) { savedMessage(); return; }
    try { showValue(record, read(id, event.newValue)); damaged.delete(id); progress(); savedMessage('Updated from another open copy of this exercise book.'); }
    catch (_) { damaged.add(id); savedMessage(); }
  });
  function snapshot() {
    const responses = {};
    fields.forEach((f, id) => { if (f.input.value) responses[id] = f.input.value; });
    return { format: FORMAT, version: 1, bookId: BOOK, savedAt: new Date().toISOString(), responses };
  }
  function validate(data) {
    if (!data || data.format !== FORMAT || data.version !== 1 || data.bookId !== BOOK || !data.responses || typeof data.responses !== 'object' || Array.isArray(data.responses)) throw new Error('Choose an answers backup made by this exercise book.');
    const entries = Object.entries(data.responses);
    if (entries.length > fields.size) throw new Error('This backup contains too many fields.');
    for (const [id, value] of entries) {
      const f = fields.get(id);
      if (!f || typeof value !== 'string' || value.length > f.limit) throw new Error('This backup contains an invalid or oversized response. No responses were changed.');
    }
    return data.responses;
  }
  function restore(data) {
    const responses = validate(data);
    fields.forEach((f, id) => showValue(f, Object.prototype.hasOwnProperty.call(responses, id) ? responses[id] : ''));
    let failed = false; fields.forEach((_, id) => { if (!persist(id)) failed = true; }); storageError = failed;
    progress(); savedMessage('Backup restored and saved in this browser.');
  }
  function retry() {
    let failed = false;
    // Retry only changes that were not saved. Never replace another tab's unrelated answers.
    for (const id of Array.from(unsaved)) if (!persist(id)) failed = true;
    try {
      if (!canRead) fields.forEach((f, id) => {
        if (unsaved.has(id) || f.input.value) return;
        try { showValue(f, read(id, localStorage.getItem(PREFIX + id))); } catch (_) { damaged.add(id); }
      });
      const probe = PREFIX + '__check__'; localStorage.setItem(probe, '1'); localStorage.removeItem(probe); canRead = true;
    } catch (_) { failed = true; }
    storageError = failed || unsaved.size > 0; progress(); savedMessage('Saved in this browser.');
  }
  document.getElementById('response-retry').addEventListener('click', retry);
  document.getElementById('response-backup').addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = make('a'); a.href = url;
    a.download = 'Exercise-Book-Answers-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    announce('Answers backup downloaded. Keep this file to restore your work later.');
  });
  document.getElementById('response-restore').addEventListener('change', async function () {
    const file = this.files[0]; if (!file) return;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error('This file is too large to be an answers backup.');
      const data = JSON.parse(await file.text()); validate(data);
      if (window.confirm('Restore this answers backup? It will replace every answer, working note, name and date currently shown in this exercise book.')) restore(data);
      else announce('Restore cancelled. Your responses have not changed.');
    } catch (error) { announce(error instanceof SyntaxError ? 'This file is not a valid answers backup. Your responses have not changed.' : error.message, true); }
    finally { this.value = ''; }
  });
  document.getElementById('response-clear').addEventListener('click', function () {
    if (!window.confirm('Clear every answer, working note, name and date in this exercise book? Download an answers backup first if you want to keep a copy.')) return;
    let failed = false; fields.forEach((f, id) => { showValue(f, ''); if (!persist(id)) failed = true; }); storageError = failed;
    progress(); savedMessage('All responses cleared from this exercise book.');
  });
  const nav = document.querySelector('#wnav .nroot');
  if (nav) { const li = make('li', null, 'nc'); li.innerHTML = '<div class="nrow"><a class="nl c b" href="#response-tools"><span class="tx">Your saved work</span></a></div>'; nav.prepend(li); }
  // Print text nodes rather than a textarea viewport, so even long working is present in the printed copy.
  window.addEventListener('beforeprint', () => fields.forEach(f => { f.print.textContent = f.input.value || '\u00a0'; }));
  window.ExerciseBookResponses = { storagePrefix: PREFIX, fieldCount: fields.size, questionCount, snapshot, restore, validate, flush: retry };
})();
