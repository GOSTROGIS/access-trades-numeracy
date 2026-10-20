/* The Answer Key: built from out/textbook-answers.json and out/exercise-answers.json (full builds of both books). */
const fs = require('fs'), path = require('path');
module.exports = function (B, L, part) {
  const S = path.join(__dirname, '..', '..');
  const OUT = path.join(__dirname, '..', 'out');
  if (part === 'front') {
    const lockup = fs.readFileSync(path.join(S, 'brand', 'access-lockup.svg'), 'utf8').replace(/width="410"/, 'width="100%"');
    const cover = '<section class="cover"><div class="top"><div class="kicker">ACCESS Trades</div>' +
      '<h1>Trades <span>Numeracy</span><br>Answer Key</h1><div class="bar"></div>' +
      '<div class="sub">Answers to every Try it set and worksheet in the Trades Numeracy Textbook, and to every exercise in the Trades Numeracy Exercise Book, with working for the longer problems. For fabrication, pipe trades, millwright and carpentry pre-apprentices.</div></div>' +
      '<div class="art"></div><div class="foot">' + lockup + '<div class="ed">Skills for Success: Numeracy</div></div></section>';
    const toc = '<section class="toc pbr"><h1>Contents</h1><!--TOC--></section>';
    const how = '<section class="front pbp"><h1 class="bm" style="font-size:20pt">How to use this key</h1>' +
      B.p('The key follows the books in order. For each chapter, Part 1 gives the answers to the textbook’s Try it sets and Shape Canvas worksheets, and Part 2 gives the answers to the Exercise Book sets A, B and C, and to any further sets in that chapter, such as the by-hand sets and the Carpentry and the BCBC sets.',
        'The appendices come after Chapter 13: Appendix A, Kitchen Math, from both books, and Appendix B, the Practice Assessment from the Exercise Book.',
        'Answers that were rounded give the same number of decimal places the question asked for. Where a problem takes more than one step, the working is shown in smaller type under the answer. Your working can be different and still be right if it reaches the same answer.') + '</section>';
    return cover + toc + how;
  }
  if (part !== 'back') return '';
  const rd = f => fs.existsSync(path.join(OUT, f)) ? JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')) : [];
  const tb = rd('textbook-answers.json'), exb = rd('exercise-answers.json');
  const toc = rd('textbook-toc.json');
  const title = {};
  /* chapter titles from the textbook, appendix titles from either book (Appendix B is in the Exercise Book only) */
  rd('exercise-toc.json').concat(toc).filter(e => e.level === 'c').forEach(e => { title[e.num] = e.title; });
  const all = Array.from(new Set(tb.map(a => a.ch).concat(exb.map(a => a.ch))));
  /* chapters by number, then appendices by letter */
  const chs = all.filter(n => typeof n === 'number' && n > 0).sort((a, b) => a - b)
    .concat(all.filter(n => typeof n === 'string' && /^[A-Z]$/.test(n)).sort());
  const group = list => { const g = []; list.forEach(a => { let s = g.find(x => x.set === a.set); if (!s) g.push(s = { set: a.set, items: [] }); s.items.push(a); }); return g; };
  const setHtml = s => '<div class="ak-set' + (s.items.length > 30 ? ' long' : '') + '"><h4>' + s.set + '</h4><ol class="ak">' + s.items.map(a => '<li value="' + a.n + '"><span class="aa">' + a.a + '</span>' + (a.work ? '<div class="aw">' + (Array.isArray(a.work) ? a.work.join('<br>') : a.work) + '</div>' : '') + '</li>').join('') + '</ol></div>';
  let h = '';
  chs.forEach(n => {
    const id = 'ak-' + n;
    const app = typeof n === 'string', word = app ? 'Appendix' : 'Chapter'
    B.toc.push({ level: 'c', id, num: n, title: title[n] || (word + ' ' + n), app });
    const t = group(tb.filter(a => a.ch === n)), e = group(exb.filter(a => a.ch === n));
    h += '<section class="ak-ch" id="' + id + '"><div class="chline">Answer Key ' + word + ' ' + n + '</div><div class="sechd">' + word + ' ' + n + ' ' + (title[n] || '') + '</div>' +
      '<div class="ex-band"><span class="n">' + n + '</span><span class="t">' + (title[n] || '') + '</span><span class="k">Answers</span></div>' +
      (t.length ? '<h3 class="sub">Part 1: Textbook</h3><div class="akcols">' + t.map(setHtml).join('') + '</div>' : '') +
      (e.length ? '<h3 class="sub">Part 2: Exercise Book</h3><div class="akcols">' + e.map(setHtml).join('') + '</div>' : '') + '</section>';
  });
  return h;
};
