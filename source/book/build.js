/* Build a book: node build.js --book textbook [--only 1,4] [--name out-name] [--png] [--no-front]
   Assembles HTML from front matter, chapter modules and back matter, paginates with Paged.js in Chromium and
   prints a US Letter PDF. Writes out/<name>.html, .pdf, -answers.json, -calcs.json, -glossary.json, -report.json */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const L = require('./engine/lib.js');
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const bookKind = arg('book', 'textbook');
const only = arg('only', null);
const name = arg('name', bookKind + (only ? '-ch' + String(only).replace(/,/g, '-') : ''));
const OUT = path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });

const META = {
  textbook: { title: 'ACCESS Trades Numeracy', kind: 'Textbook' },
  exercise: { title: 'ACCESS Trades Numeracy', kind: 'Exercise Book' },
  answers: { title: 'ACCESS Trades Numeracy', kind: 'Answer Key' }
};
const B = new L.Book(META[bookKind]);
B.kind = bookKind;
if (bookKind === 'exercise') B.wsLabel = 'Exercise';

/* chapter modules for this book, in order */
const dir = path.join(__dirname, bookKind === 'exercise' ? 'exercises' : 'chapters');
let files = bookKind !== 'answers' && fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^ch\d\d.*\.js$/.test(f)).sort() : [];
if (only) { const set = String(only).split(',').map(Number); files = files.filter(f => set.includes(+f.slice(2, 4))); }

let body = '';
const front = !args.includes('--no-front') && (!only || bookKind === 'answers');
const fm = path.join(__dirname, 'engine', 'front-' + bookKind + '.js');
if (front && fs.existsSync(fm)) body += require(fm)(B, L, 'front');
const chapters = [];
for (const f of files) {
  const mod = require(path.join(dir, f));
  const t0 = Date.now();
  chapters.push(mod(B, L));
  console.log('  built ' + f + ' (' + (Date.now() - t0) + ' ms)');
}
if (front && fs.existsSync(fm)) body = require(fm)(B, L, 'front');
body += chapters.join('\n');
if (front && fs.existsSync(fm)) body += require(fm)(B, L, 'back');
/* contents placeholder is filled after chapters so the toc list is complete */
body = body.replace('<!--TOC-->', tocHtml(B));
/* keep a number with its unit on one line: a non-breaking space in reading text (not inside tags or SVG) */
body = body.replace(/(<svg[\s\S]*?<\/svg>)|(<[^>]+>)|([^<]+)/g, (all, svgPart, tag, text) => {
  if (svgPart || tag) return all;
  return text.replace(/(\d) (?=(mm|cm|km|m|in|ft|yd|mi|L|mL|kg|g|t|lb|psi|kPa|bar|US gal|imperial gal|gal|mm²|cm²|m²|in²|ft²|mm³|cm³|m³|in³|ft³|pieces|holes|bolts|boxes)(?![A-Za-z]))/g, '$1\u00A0');
});
/* second pass across inline tags (stacked fractions, number spans): units, formula operators,
   "D = 800" style values, mixed numbers with a fraction glyph, and digit groups like 3.785 411 784 */
{
  const C = '(?:<\\/(?:span|b|strong|em|i|sup|sub)>)*'
  const O = '(?:<(?:span|b|strong|em|i|sup|sub)(?:\\s[^>]*)?>)*'
  const U = '(?:mm|cm|km|m|in|ft|yd|mi|L|mL|kg|g|lb|psi|kPa|gal|mm²|cm²|m²|in²|ft²|mm³|cm³|m³|in³|ft³|°F|°C|sixteenths)(?![A-Za-z])'
  const NB = ' '
  const fixChunk = s => s
    .replace(new RegExp('(\\d' + C + ') (?=' + O + U + ')', 'g'), '$1' + NB)
    .replace(new RegExp('([\\d)]' + C + ') ([+\\u2212×÷=]) (?=' + O + '[\\d(\\u2212])', 'g'), '$1' + NB + '$2' + NB)
    .replace(/(\b[A-Za-z]) = (?=[\d−])/g, '$1' + NB + '=' + NB)
    .replace(/(\d) (?=[½⅓⅔¼¾⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]|<span class="fr)/g, '$1' + NB)
    .replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NB)
  body = body.replace(/(<svg[\s\S]*?<\/svg>)|((?:(?!<svg)[\s\S])+)/g, (all, svgPart, rest) => svgPart ? all : fixChunk(rest))
}

function tocHtml(B) {
  let h = '<ol>';
  B.toc.forEach(e => {
    if (e.level === 'c') h += '<li class="c"><a href="#' + e.id + '"><span class="tx"><span class="cn">' + e.num + '</span>' + e.title + '</span><span class="dots"></span></a></li>';
    else if (e.level === 's' && !/^Worksheet/.test(e.title)) h += '<li class="s"><a href="#' + e.id + '"><span class="tx">' + e.num + '&ensp;' + e.title + '</span><span class="dots"></span></a></li>';
    else if (e.level === 'x') h += '<li class="s"><a href="#' + e.id + '"><span class="tx">Exercise ' + e.num + '&ensp;' + e.title + '</span><span class="dots"></span></a></li>';
    else if (e.level === 'b') h += '<li class="c"><a href="#' + e.id + '"><span class="tx">' + e.title + '</span><span class="dots"></span></a></li>';
  });
  return h + '</ol>';
}
const rel = p => path.relative(OUT, path.join(__dirname, p)).split(path.sep).join('/');
const html = '<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><title>' + META[bookKind].title + ' ' + META[bookKind].kind + '</title>' +
  '<link rel="stylesheet" href="' + rel('styles/fonts.css') + '"><link rel="stylesheet" href="' + rel('styles/book.css') + '">' +
  '<script>window.PagedConfig={auto:true,after:function(flow){window.__pages=flow.total}}</script>' +
  '<script src="' + rel('vendor/node_modules/pagedjs/dist/paged.polyfill.js') + '"></script></head><body>' + body + '</body></html>';
fs.writeFileSync(path.join(OUT, name + '.html'), html);
fs.writeFileSync(path.join(OUT, name + '-answers.json'), JSON.stringify(B.answers, null, 1));
fs.writeFileSync(path.join(OUT, name + '-calcs.json'), JSON.stringify(B.calcs, null, 1));
fs.writeFileSync(path.join(OUT, name + '-glossary.json'), JSON.stringify(B.glossary, null, 1));
fs.writeFileSync(path.join(OUT, name + '-toc.json'), JSON.stringify(B.toc, null, 1));
console.log('HTML written: ' + B.calcs.length + ' calculator sequences checked, ' + B.answers.length + ' answers, ' + Object.keys(B.glossary).length + ' glossary terms');

(async () => {
  const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  /* Paged.js reads the stylesheets with XHR, so the book is served over a local HTTP server */
  const http = require('http');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const srv = http.createServer((req, res) => {
    const fp = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
    if (!fp.startsWith(__dirname) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const PORT = srv.address().port;
  const br = await chromium.launch();
  const page = await br.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:' + PORT + '/out/' + encodeURIComponent(name) + '.html');
  await page.waitForFunction(() => window.__pages || window.__pagedError, null, { timeout: 15 * 60 * 1000, polling: 500 });
  if (errs.length && !(await page.evaluate(() => window.__pages))) throw new Error('Paged.js failed: ' + errs.join(' | '));
  /* print-size floor for drawing labels: a dimension label (text drawn on a white or pink chip) that would print under
     7 pt is enlarged about its own anchor, chip and all. The drawing's size and the page layout do not change. */
  const grown = await page.evaluate(() => {
    const MIN = 7 * 96 / 72, CAP = 2.2;
    let n = 0;
    document.querySelectorAll('.pagedjs_page svg text').forEach(tx => {
      const r = tx.previousElementSibling;
      if (!r || r.tagName.toLowerCase() !== 'rect') return;
      const fill = (r.getAttribute('fill') || '').toUpperCase();
      if (!/^#(FFF|FFFFFF|FAE8E9)$/.test(fill)) return;
      const ctm = tx.getScreenCTM(); if (!ctm) return;
      const fs = parseFloat(tx.getAttribute('font-size') || getComputedStyle(tx).fontSize);
      const px = fs * Math.hypot(ctm.a, ctm.b);
      if (!(px > 0) || px >= MIN) return;
      const k = Math.min(CAP, MIN / px);
      const x = parseFloat(tx.getAttribute('x')), y = parseFloat(tx.getAttribute('y'));
      const rx = parseFloat(r.getAttribute('x')), ry = parseFloat(r.getAttribute('y')), rw = parseFloat(r.getAttribute('width')), rh = parseFloat(r.getAttribute('height'));
      if (![x, y, rx, ry, rw, rh].every(isFinite)) return;
      /* the chip must sit around the text, otherwise it is not a label chip */
      if (Math.abs((rx + rw / 2) - x) > rw && tx.getAttribute('text-anchor') === 'middle') return;
      const cy = y - fs * 0.35;
      tx.setAttribute('font-size', fs * k);
      tx.setAttribute('y', cy + (y - cy) * k);
      r.setAttribute('x', x + (rx - x) * k); r.setAttribute('width', rw * k);
      r.setAttribute('y', cy + (ry - cy) * k); r.setAttribute('height', rh * k);
      n++;
    });
    return n;
  });
  console.log('  labels enlarged to 7 pt: ' + grown);
  const rep = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.pagedjs_page'));
    const over = [];
    pages.forEach((pg, i) => {
      const c = pg.querySelector('.pagedjs_page_content');
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.querySelectorAll('figure, .ex, .calc, .box, table, .prob, .canvas, svg, .try').forEach(el => {
        const b = el.getBoundingClientRect();
        if (b.width > 0 && (b.right > r.right + 2 || b.bottom > r.bottom + 2)) over.push({ page: i + 1, cls: el.className.baseVal != null ? 'svg' : el.className, by: Math.round(Math.max(b.right - r.right, b.bottom - r.bottom)) });
      });
    });
    const fonts = Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
    const blank = pages.filter(p => p.classList.contains('pagedjs_blank_page')).length;
    return { total: pages.length, blank, over: over.slice(0, 60), fonts: Array.from(new Set(fonts)) };
  });
  await page.pdf({ path: path.join(OUT, name + '.pdf'), preferCSSPageSize: true, printBackground: true, timeout: 15 * 60 * 1000 });
  await br.close();
  srv.close();
  rep.errors = errs; rep.seconds = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(OUT, name + '-report.json'), JSON.stringify(rep, null, 1));
  console.log('PDF: ' + rep.total + ' pages (' + rep.blank + ' blank), ' + rep.over.length + ' overflowing items, ' + errs.length + ' errors, ' + rep.seconds + ' s')
  if (rep.over.length) console.log('  overflow: ' + JSON.stringify(rep.over.slice(0, 12)));
  if (errs.length) console.log('  errors: ' + errs.slice(0, 5).join(' | '));
  if (args.includes('--png')) {
    const pd = path.join(OUT, name + '-png'); fs.rmSync(pd, { recursive: true, force: true }); fs.mkdirSync(pd);
    cp.execSync('pdftoppm -r 55 -png "' + path.join(OUT, name + '.pdf') + '" "' + path.join(pd, 'p') + '"');
    console.log('  page images: ' + pd);
  }
})().catch(e => { console.error(e); process.exit(1); });
