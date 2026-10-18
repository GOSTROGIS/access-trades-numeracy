/* ACCESS Trades Numeracy books: authoring helpers. Every helper returns an HTML string.
   A chapter module exports function (B) { return B.chapter({...}, [parts]) } and uses B.* helpers.
   Numbers stated in calculator boxes are checked against the TI-30Xa emulator, and the Sharp EL-531XT keys
   come from the hub translator and are checked to give the same value (engine/calc.js). */
const path = require('path');
const Shapes = require(path.join(__dirname, '..', '..', 'canvas', 'src', 'vendor', 'shapes-engine.js'));
const CALC = require('./calc.js');

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function join(parts) { return (Array.isArray(parts) ? parts : [parts]).flat(Infinity).filter(x => x != null && x !== false).join('\n'); }

/* ---------- numbers ---------- */
/* whole numbers of 4 or more digits get thousands commas (hub convention). dp: fixed places, or null for as-is */
function num(x, dp) {
  let s = dp == null ? String(parseFloat((+x).toFixed(9))) : (+x).toFixed(dp);
  if (/e/i.test(s)) s = (+x).toFixed(dp == null ? 10 : dp).replace(/0+$/, '').replace(/\.$/, '');
  const neg = s[0] === '-'; if (neg) s = s.slice(1);
  let [w, d] = s.split('.');
  if (w.length >= 4) w = w.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '−' : '') + w + (d != null ? '.' + d : '');
}
function round(x, dp) { const f = Math.pow(10, dp); return Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f; }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
/* stacked fraction */
function fr(n, d) { return '<span class="fr"><span>' + n + '</span><span>' + d + '</span></span>'; }
/* mixed number: whole + stacked fraction */
function mx(w, n, d) { return '<span class="mx">' + (w ? w : '') + fr(n, d) + '</span>'; }
/* a fraction value in lowest terms as HTML: improper -> mixed */
function frac(n, d, opts) {
  opts = opts || {};
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  const neg = n < 0; n = Math.abs(n);
  if (d === 1) return (neg ? '−' : '') + n;
  if (n > d && !opts.improper) return (neg ? '−' : '') + mx(Math.floor(n / d), n % d, d);
  return (neg ? '−' : '') + fr(n, d);
}
/* inches to the nearest 1/den, as a mixed number with the inch mark */
function inch(x, den) {
  den = den || 16;
  let t = Math.round(x * den), w = Math.floor(t / den), r = t - w * den;
  if (!r) return w + '″';
  const g = gcd(r, den);
  return (w ? w : '') + fr(r / g, den / g) + '″';
}
/* feet and inches: 5′ 3½″ style, inches to nearest 1/den */
function ftin(totalIn, den) {
  den = den || 16;
  let t = Math.round(totalIn * den), ft = Math.floor(t / (12 * den)); t -= ft * 12 * den;
  const w = Math.floor(t / den), r = t - w * den;
  let ins = r ? (w || ft ? w : '') + fr(r / gcd(r, den), den / gcd(r, den)) : String(w);
  return (ft ? ft + '′ ' : '') + ins + '″';
}
function m(s) { return '<span class="m">' + s + '</span>'; }

/* ---------- the book ---------- */
function Book(meta) {
  const B = this;
  B.meta = meta;
  B.ch = 0; B.sec = 0; B.ex = 0; B.fig = 0; B.tab = 0; B.wsN = 0;
  B.toc = []; B.answers = []; B.glossary = {}; B.calcs = []; B.problemsSeen = 0;
  let uid = 0;
  const id = p => p + '-' + (++uid);

  /* ----- structure ----- */
  /* Content is a flat list evaluated in order: [B.chapter({...}), B.section('...'), B.p(...), B.example(...), ...,
     B.worksheet({...}), B.prob(...), ...]. Headings are separate items so numbering follows the reading order. */
  B.chapter = function (o, parts) {
    if (parts) throw new Error('B.chapter takes only its options. List the content after it.');
    B.ch = o.num; B.sec = 0; B.ex = 0; B.fig = 0; B.tab = 0; B.wsN = 0; B.chId = o.id; B.curWs = null; B.chTitle = o.title;
    const cid = 'ch-' + o.num;
    B.toc.push({ level: 'c', id: cid, num: o.num, title: o.title });
    return '<section class="chapter ch-open" id="' + cid + '" data-ch="' + o.num + '">' +
      '<div class="band"><div class="lab">Chapter</div><div class="num">' + o.num + '</div>' +
      '<h1>' + o.title + '</h1><div class="rule"></div>' +
      '<div class="intro">' + join(o.intro) + '</div>' +
      '<div class="cols"><div class="card"><h4>In this chapter you will</h4><ul>' + o.objectives.map(x => '<li>' + x + '</li>').join('') + '</ul></div>' +
      '<div class="card"><h4>Key words</h4><ul>' + (o.words || []).map(x => '<li>' + x + '</li>').join('') + '</ul></div></div>' +
      (o.art ? '<div class="art">' + o.art + '</div>' : '') + '</div></section>';
  };
  /* Exercise Book chapter start: a short banner, no opener page. o: { num, id, title, intro } */
  B.exChapter = function (o) {
    B.ch = o.num; B.sec = 0; B.ex = 0; B.fig = 0; B.tab = 0; B.wsN = 0; B.chId = o.id; B.curWs = null; B.chTitle = o.title;
    const cid = 'ch-' + o.num;
    B.toc.push({ level: 'c', id: cid, num: o.num, title: o.title });
    return '<section class="ex-ch" id="' + cid + '"><div class="chline">Chapter ' + o.num + '\u2002' + o.title + '</div><div class="sechd">Chapter ' + o.num + ' exercises</div>' +
      '<div class="ex-band"><span class="n">' + o.num + '</span><span class="t">' + o.title + '</span><span class="k">Exercises</span></div>' + (o.intro ? '<div class="ex-intro">' + o.intro + '</div>' : '') + '</section>';
  };
  B.section = function (title, parts) {
    if (parts) throw new Error('B.section takes only its title. List the content after it.');
    B.sec++; B.curWs = null;
    const sid = 'sec-' + B.ch + '-' + B.sec;
    B.toc.push({ level: 's', id: sid, num: B.ch + '.' + B.sec, title });
    return '<h2 class="sec" id="' + sid + '"><span class="chline">Chapter ' + B.ch + '\u2002' + B.chTitle + '</span><span class="sechd">' + B.ch + '.' + B.sec + '\u2002' + title + '</span><span class="n">' + B.ch + '.' + B.sec + '\u2002</span>' + title + '</h2>';
  };
  B.sub = t => '<h3 class="sub">' + t + '</h3>';
  B.p = (...xs) => xs.map(x => '<p>' + x + '</p>').join('');
  B.ul = items => '<ul>' + items.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  B.ol = items => '<ol>' + items.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  B.how = items => '<ol class="how">' + items.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  B.b = s => '<b>' + s + '</b>';
  B.i = s => '<i>' + s + '</i>';
  B.raw = s => s;
  /* key word: highlighted, and defined once in the glossary */
  B.term = function (word, def, shown) {
    const k = word.toLowerCase();
    if (def) {
      if (B.glossary[k] && B.glossary[k].def !== def) throw new Error('glossary term defined twice with different wording: ' + word);
      B.glossary[k] = { word, def, ch: B.ch };
    }
    return '<span class="kw">' + (shown || word) + '</span>';
  };

  /* ----- boxes ----- */
  const box = (cls, label) => (title, ...body) => '<div class="box ' + cls + '"><div class="hd">' + (title || label) + '</div>' + join(body.map(x => /^\s*</.test(x) ? x : '<p>' + x + '</p>')) + '</div>';
  B.tip = box('tip', 'Tip');
  B.watch = box('watch', 'Watch out');
  B.shop = box('shop', 'On the job');
  B.keyidea = box('keyidea', 'Key idea');
  B.formula = function (title, rows, key) {
    return '<div class="box formula"><div class="hd">' + (title || 'Formula') + '</div>' + rows.map(r => '<div class="f">' + r + '</div>').join('') + (key ? '<div class="k">' + key + '</div>' : '') + '</div>';
  };

  /* ----- figures and tables ----- */
  B.figure = function (svg, caption, o) {
    o = o || {};
    B.fig++;
    const n = 'Figure ' + B.ch + '.' + B.fig;
    const st = o.width ? ' style="width:' + o.width + ';margin:0 auto"' : '';
    return '<figure' + (o.cls ? ' class="' + o.cls + '"' : '') + '><div class="fgw"' + st + '>' + svg + '</div>' + (caption ? '<figcaption><span class="n">' + n + '</span>' + caption + '</figcaption>' : '') + '</figure>';
  };
  B.figrow = (...figs) => '<div class="figrow">' + figs.join('') + '</div>';
  B.table = function (head, rows, o) {
    o = o || {};
    B.tab++;
    const al = o.align || [];
    const th = '<tr>' + head.map((h, i) => '<th class="' + (al[i] || '') + '">' + h + '</th>').join('') + '</tr>';
    const tb = rows.map(r => '<tr>' + r.map((c, i) => '<td class="' + (al[i] || '') + '">' + c + '</td>').join('') + '</tr>').join('');
    return '<table class="t"' + (o.width ? ' style="width:' + o.width + '"' : '') + '>' + th + tb + '</table>' + (o.caption ? '<div class="tcap"><span class="n">Table ' + B.ch + '.' + B.tab + '</span>' + o.caption + '</div>' : '');
  };

  /* ----- Shapes engine drawings ----- */
  /* opts: labels ('values' default), units, hide: ['w'] shows a red ? for those dimensions (Shape Canvas practice),
     width (CSS), plus any Shapes.render option */
  B.shape = function (sid, params, opts) {
    opts = Object.assign({ labels: 'values', units: 'mm', derived: 'hide' }, opts || {});
    const err = Shapes.validate(sid, params, opts.ao);
    if (err) throw new Error('shape ' + sid + ' ' + JSON.stringify(params) + ': ' + err.msg);
    let svg = Shapes.render(sid, params, opts);
    if (opts.hide && opts.hide.length) svg = hideLabels(sid, params, opts, svg, false);
    return sized(svg, opts.width);
  };
  B.net = function (sid, params, opts) {
    opts = Object.assign({ labels: 'values', units: 'mm', derived: 'hide' }, opts || {});
    let svg = Shapes.net(sid, params, opts);
    if (!svg) throw new Error('no net for ' + sid);
    if (opts.hide && opts.hide.length) svg = hideLabels(sid, params, opts, svg, true);
    return sized(svg, opts.width);
  };
  B.shapeCalc = (sid, params, units, ao) => Shapes.calc(sid, params, units, ao);
  B.Shapes = Shapes;
  function sized(svg, w) {
    return svg.replace(/^<svg ([^>]*?)width="[\d.]+" height="[\d.]+"/, (a, pre) => '<svg ' + pre + 'width="100%" style="max-width:' + (w || '3.2in') + '"');
  }
  /* replace the value label of each hidden dimension with a red "?" chip, by matching label order against a
     letters-only rendering of the same drawing */
  function hideLabels(sid, params, opts, svg, isNet) {
    const lo = Object.assign({}, opts, { labels: 'letters' });
    const lsvg = isNet ? Shapes.net(sid, params, lo) : Shapes.render(sid, params, lo);
    const re = /<rect ([^>]*)\/><text ([^>]*)>([^<]*)<\/text>/g;
    const letters = []; let mm;
    while ((mm = re.exec(lsvg))) letters.push(mm[3]);
    let i = -1;
    const out = svg.replace(re, (all, ra, ta, txt) => {
      i++;
      if (!opts.hide.includes(letters[i])) return all;
      const w = 26;
      const x = +(/x="([-\d.]+)"/.exec(ta) || [0, 0])[1], y = +(/y="([-\d.]+)"/.exec(ta) || [0, 0])[1];
      return '<rect x="' + (x - 17) + '" y="' + (y - 20) + '" width="34" height="27" rx="4" fill="#FAE8E9" stroke="#D2181F" stroke-width="1.8"/><text x="' + x + '" y="' + (y + 2) + '" text-anchor="middle" font-family="Archivo, IBM Plex Sans, sans-serif" font-size="22" font-weight="800" fill="#D2181F">?</text>';
    });
    if (i + 1 !== letters.length) throw new Error('label count mismatch hiding ' + sid);
    const missing = opts.hide.filter(h => !letters.includes(h));
    if (missing.length) throw new Error('cannot hide ' + missing.join(',') + ' on ' + sid + ' (labels: ' + letters.join(',') + ')');
    return out;
  }

  /* ----- calculator ----- */
  /* B.calc({ seq, expect, title, say, rows:[{label, seq, expect}] }) -> calculator box with TI-30Xa and
     Sharp EL-531XT keys and each calculator's display. expect is the plain number the text states. */
  B.calc = function (o) {
    const rows = o.rows || [{ seq: o.seq, expect: o.expect, label: o.label }];
    const where = 'ch' + B.ch + ' ' + (o.title || '');
    rows.forEach(r => { B.calcs.push(CALC.calcCheck(r.seq, r.expect, where)); });
    const col = (md) => {
      let h = '<div class="col"><div class="mdl">' + md.name + '</div>';
      rows.forEach(r => {
        const d = CALC.screenText(r.seq, md.id);
        h += (r.label ? '<div class="rowlab">' + r.label + '</div>' : '') +
          '<div class="keys">' + CALC.chips(r.seq, md.id) + '</div>' +
          '<div class="disp">Display <span class="lcd">' + esc(d.main) + (d.exp ? '<span class="e">' + esc(d.exp) + '</span>' : '') + '</span></div>';
      });
      return h + '</div>';
    };
    return '<div class="calc"><div class="hd">Calculator' + (o.title ? '<span class="t">' + o.title + '</span>' : '') + '</div>' +
      '<div class="cols">' + CALC.MODELS.map(col).join('') + '</div>' +
      (o.say ? '<div class="say">' + o.say + '</div>' : '') + '</div>';
  };
  /* a calculator check without a box (for numbers stated in prose that came from a key sequence) */
  B.check = (seq, expect) => { B.calcs.push(CALC.calcCheck(seq, expect, 'ch' + B.ch + ' check')); return ''; };

  /* ----- examples ----- */
  /* B.example({ title, q, steps:[..], answer, calc:{...}, fig, long }) */
  B.example = function (o) {
    B.ex++;
    const n = 'Example ' + B.ch + '.' + B.ex;
    let h = '<div class="ex' + (o.long ? ' long' : '') + '"><div class="hd"><span class="n">' + n + '</span>' + (o.title || '') + '</div><div class="bd">';
    if (o.fig) h += '<div class="fig">' + o.fig + '</div>';
    if (o.q) h += '<div class="q">' + o.q + '</div>';
    if (o.steps && o.steps.length) h += '<div class="lbl">Solution</div><ol class="steps">' + o.steps.map(s => '<li>' + s + '</li>').join('') + '</ol>';
    if (o.after) h += o.after;
    h += '<div class="clear"></div>';
    if (o.calc) h += B.calc(o.calc);
    if (o.answer) h += '<div class="a">' + o.answer + '</div>';
    return h + '</div></div>';
  };

  /* ----- practice ----- */
  /* B.tryIt([{q, a}], {cols:1}) quick practice after a section. Answers go to the answer key book. */
  B.tryIt = function (items, o) {
    o = o || {};
    const set = 'Try it ' + B.ch + '.' + B.sec;
    items.forEach((it, k) => B.answers.push({ ch: B.ch, set, n: k + 1, q: it.q, a: it.a, work: it.work || null }));
    return '<div class="try"><div class="hd">' + set + '</div><ol' + (o.cols === 1 ? ' class="one"' : '') + '>' + items.map(it => '<li>' + it.q + '</li>').join('') + '</ol><div class="note">Answers are in the Answer Key.</div></div>';
  };
  /* B.worksheet({ title, sub, intro, mode }, [B.prob(...) or html]) a Shape Canvas worksheet page */
  B.worksheet = function (o, items) {
    if (items) throw new Error('B.worksheet takes only its options. List B.prob(...) items after it.');
    B.wsN++;
    const letter = String.fromCharCode(64 + B.wsN);
    const WL = B.wsLabel || 'Worksheet';
    B.curWs = WL + ' ' + B.ch + letter; B.wsProb = 0;
    const wid = 'ws-' + B.ch + letter;
    B.toc.push({ level: B.wsLabel ? 'x' : 's', id: wid, num: B.ch + letter, title: (B.wsLabel ? '' : 'Worksheet: ') + o.title });
    return '<div class="ws"><div class="ws-head" id="' + wid + '"><span class="chline">Chapter ' + B.ch + '\u2002' + B.chTitle + '</span><span class="sechd">' + WL + ' ' + B.ch + letter + '\u2002' + o.title + '</span><div class="tag">' + WL + ' ' + B.ch + letter + '</div><div class="ttl">' + o.title + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</div><div class="who">Name<div></div>Date<div></div></div></div>' + (o.intro ? '<div class="ws-intro">' + o.intro + '</div>' : '') + '</div>';
  };
  /* B.prob({ q, a, canvas, fig, lines, work }) a numbered worksheet problem. canvas: an svg shown on the dotted
     Shape Canvas ground. lines: rows in the working box (0 = none). a: the answer for the answer key. */
  B.prob = function (o) {
    if (!B.curWs) throw new Error('prob() outside a worksheet');
    B.wsProb++;
    B.answers.push({ ch: B.ch, set: B.curWs, n: B.wsProb, q: o.q, a: o.a, work: o.work || null });
    let h = '<div class="prob"><div class="pn">' + B.wsProb + '</div><div class="pbody"><div class="pq">' + o.q + '</div>';
    if (o.canvas) h += B.canvas(o.canvas, o.mode);
    if (o.fig) h += o.fig;
    const lines = o.lines == null ? 3 : o.lines;
    if (lines) h += '<div class="workbox" style="height:' + (lines * 17.7 + 4) + 'pt">' + (o.ansLabel !== false ? '<div class="ansrow">' + (o.ansLabel || 'Answer') + '<span></span></div>' : '') + '</div>';
    return h + '</div></div>';
  };
  /* the Shape Canvas ground. The mode label says "Practice: find the ?" only when the drawing has a ? chip */
  B.canvas = (svg, mode) => '<div class="canvas"><div class="cv-bar"><span class="dot"></span>Shape Canvas<span class="mode">' + (mode || (/>\?</.test(svg) ? 'Practice: find the ?' : 'Read the drawing')) + '</span></div>' + svg + '</div>';
  B.workbox = (lines, label) => '<div class="workbox" style="height:' + (lines * 17.7 + 4) + 'pt">' + (label ? '<div class="ansrow">' + label + '<span></span></div>' : '') + '</div>';
  B.grid2 = (...items) => '<div class="ws-grid">' + join(items) + '</div>';
}

module.exports = { Book, esc, join, num, round, gcd, fr, mx, frac, inch, ftin, m, Shapes, CALC };
