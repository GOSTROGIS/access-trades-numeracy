/* Front and back matter for the textbook. part = 'front' | 'back' */
const fs = require('fs'), path = require('path');
module.exports = function (B, L, part) {
  const S = path.join(__dirname, '..', '..');
  const F = require('./figs.js');
  if (part === 'front') {
    const badge = require('./brand.js').badge();
    const art = '<div style="display:flex;gap:18pt;align-items:flex-end;justify-content:center">' +
      B.shape('cylinder', { r: 60, h: 140 }, { labels: 'none', width: '1.6in' }) +
      B.net('cylinder', { r: 60, h: 140 }, { labels: 'none', width: '2.2in' }) +
      B.shape('right-triangle', { b: 120, h: 90 }, { labels: 'none', width: '1.7in' }) + '</div>';
    const cover = '<section class="cover"><div class="top"><div class="kicker">ACCESS Indigenous Skills4Success</div>' +
      '<h1>Trades <span>Numeracy</span><br>Textbook</h1><div class="bar"></div>' +
      '<div class="sub">Whole numbers to trigonometry, with key-by-key calculator steps for the TI-30Xa and the Sharp EL-531XT. For fabrication, pipe trades, millwright and carpentry pre-apprentices.</div></div>' +
      '<div class="art">' + art + '</div>' +
      '<div class="foot">' + badge + '<div class="ed">Skills for Success: Numeracy<br>Metric and imperial</div></div></section>';
    const about = '<section class="front pbp">' +
      '<h1 class="bm" style="font-size:20pt">About this book</h1>' +
      B.p('This textbook covers the mathematics a pre-apprentice uses every day in the shop: whole numbers, fractions and decimals, percent and ratio, measurement and unit conversion, formulas and how to rearrange them, perimeter, area, volume, right triangles and trigonometry.',
        'Each chapter opens with what you will learn and the key words to watch for. The ideas are explained in plain language, then shown in worked examples. Short Try it sets let you practise straight away. Each chapter ends with Shape Canvas worksheets that use the same drawings and practice ideas as the ACCESS Shape Canvas app.',
        'Two calculators are used throughout: the Texas Instruments TI-30Xa and the Sharp EL-531XT. Every calculator box shows the keys for both, side by side, and what each display reads after the last key.',
        'Sizes are given in metric first and imperial second. Answers to every Try it set and worksheet are in the separate Answer Key. The companion Exercise Book has more practice for each chapter.',
        'The book serves four trades: fabrication, pipe trades, millwright and carpentry. Carpentry sits alongside the other three. Its examples and worksheets cover framing, stairs, sheet goods and concrete, and its code values are quoted from the BC Building Code. The page Using the BC Building Code explains how those quotes work.',
        'Appendix A, Kitchen Math, follows Chapter 13. It covers recipe scaling, cooking measures and food yield percent.') +
      B.keyidea('How to read a size', 'In this book 1,250 mm means one thousand two hundred fifty millimetres. 5′ 3' + L.fr(1, 2) + '″ means five feet three and one half inches. The symbol ≈ means “about equal to” and is used when an answer is rounded.') +
      '</section>';
    const toc = '<section class="toc pbr"><h1>Contents</h1><!--TOC--></section>';
    /* how to use, with live samples of each feature */
    const exSample = '<div class="ex" style="margin-top:4pt"><div class="hd"><span class="n">Example 1.8</span>Counting bolts</div><div class="bd"><div class="q">A job needs 24 brackets. Each bracket is held by 4 bolts. How many bolts are needed?</div><div class="lbl">Solution</div><ol class="steps"><li>24 groups of 4: 24 \u00D7 4.</li><li>20 \u00D7 4 = 80 and 4 \u00D7 4 = 16. 80 + 16 = 96.</li></ol><div class="a">96 bolts</div></div></div>';
    const howto = '<section class="front howto pbr"><h1 class="bm" style="font-size:20pt">How to use this book</h1>' +
      '<div class="grid">' +
      '<div><h4>Worked examples</h4>' + B.p('Examples are numbered by chapter. Read the question, try it yourself, then check each step.') + exSample + '</div>' +
      '<div><h4>Calculator boxes</h4>' + B.p('The left column shows the TI-30Xa keys, the right column the Sharp EL-531XT keys. Grey keys are numbers, white keys are operations and functions, and a gold key is the second-function key (2nd or 2ndF) pressed before the key after it. The display shows what that calculator reads after the last key.') +
      B.calc({ seq: 'π × 152.4 =', expect: '478.78', say: 'Rounded to two decimal places: <b>478.78</b>' }) + '</div>' +
      '<div><h4>Try it</h4>' + B.p('Quick practice at the end of a section. Do these before you move on. Answers are in the Answer Key.') +
      '<h4>Boxes</h4>' + B.tip('Tip', 'A shortcut or a good habit.') + B.watch('Watch out', 'A common mistake and how to avoid it.') + B.shop('On the job', 'How the idea shows up in the shop.') + B.keyidea('Key idea', 'The one thing to remember from a section.') + '</div>' +
      '<div><h4>Shape Canvas worksheets</h4>' + B.p('The worksheets use the drawings and practice ideas of the ACCESS Shape Canvas app. A red ? marks a size that is hidden: find it. Dashed lines <b>break a part down</b> into simple shapes. A solid shown beside its flat pattern is <b>unfolded</b> into its net. Callouts point to the part a question is about. Show your work in the working box and write the answer on the answer line.') +
      B.canvas(B.shape('rectangle', { l: 1200, w: 600 }, { hide: ['w'], width: '2.6in' })) + '</div>' +
      '</div></section>';
    /* Using the BC Building Code. Every code fact on this page is read from the code text through engine/plates.js
       (Division B Articles) or was read in bcbc.txt (Division A, Sentence 1.3.3.3.(1), page 1-12, and the
       Numbering System in the preface). The quoted rise limits are checked against the Article text at build time. */
    const PL = require('./plates.js')
    const a1 = PL.article('9.8.4.1')
    if (!/Private\s*\(1\)\s+200\s+125/.test(a1.text) || !/vertical nosing-to-nosing distance/.test(a1.text)) throw new Error('front matter: the quote from Article 9.8.4.1 no longer matches the code text')
    const nPlates = Object.keys(PL.plateIndex()).length
    const levels = [
      ['Part', '9', 'Housing and Small Buildings'],
      ['Section', a1.section[0] + '.', a1.section[1]],
      ['Subsection', a1.subsection[0] + '.', a1.subsection[1]],
      ['Article', a1.num + '.', a1.title],
      ['Sentence', a1.num + '.(1)', 'The numbered sentence (1) inside the Article'],
      ['Clause', a1.num + '.(1)(a)', 'A lettered part of a Sentence, where the code uses one'],
      ['Subclause', a1.num + '.(1)(a)(i)', 'A part of a Clause, where the code uses one']
    ]
    const plateFig = PL.has('9.8.4.1') ? '<div class="bcbc-sample"><div class="fgw">' + PL.svg('9.8.4.1', { crop: [566, 316, 440, 340] }) + '</div><div class="cap">The side view panel of the ACCESS teaching plate for Article 9.8.4.1. The plate shows the idea. The code text sets the values.</div></div>' : ''
    const bcbc = '<section class="front bcbc-page pbp"><h1 class="bm" style="font-size:20pt">Using the BC Building Code</h1>' +
      B.p('The carpentry pages of this book quote the <b>British Columbia Building Code 2024</b>, Book I: General, written <b>BCBC 2024</b> in this book. The code is set out in three Divisions. Division A covers compliance, objectives and functional statements. Division B holds the acceptable solutions, which are the technical requirements. Division C holds the administrative provisions.',
        '<b>Part 9</b> of Division B is titled Housing and Small Buildings. It applies to buildings of 3 storeys or less in building height, with a building area of not more than 600 m², used for residential occupancies, business and personal services occupancies, mercantile occupancies, or medium- and low-hazard industrial occupancies (Division A, Sentence 1.3.3.3.(1), page 1-12). The framing, stair, footing and floor values in this book all come from Part 9.') +
      '<h4>How a code number is built</h4>' +
      B.table(['Level', 'Number', 'For example'], levels.map(r => [r[0], '<span class="m">' + r[1] + '</span>', r[2]]), { align: ['', '', ''] }).replace(/<div class="tcap">[\s\S]*?<\/div>$/, '') +
      B.p('The first number is the Part, the second the Section, the third the Subsection and the fourth the Article. The requirements themselves are in the Sentences, the numbers in brackets. A Sentence can be broken into Clauses and Subclauses.') +
      '<h4>How this book quotes the code</h4>' +
      B.p('Every code value in this book names the Article and Sentence it comes from and the page of the code it is printed on, like this: <b>' + PL.cite('9.8.4.1') + '</b>. Page ' + a1.page + ' is the page number printed in the code itself, not a page of this book.',
        'Values are quoted at the level the code states them. The stair rise limits are given in millimetres, so the book quotes millimetres. When the book shows the same value in inches, that is a conversion for the shop, not a code value.') +
      B.keyidea('A quote, read from the code text', 'Except for stairs serving areas only used as service rooms or service spaces, the rise, measured as the vertical nosing-to-nosing distance, must comply with Table ' + a1.num + '. For a private stair the table gives a maximum rise of 200 mm and a minimum rise of 125 mm. Source: BCBC 2024, Division B, Sentence ' + a1.num + '.(1) and Table ' + a1.num + '. (page ' + a1.page + ').') +
      '<h4>The plates are teaching drawings</h4>' + plateFig +
      B.p('The drawings with a BCBC source line under them are <b>ACCESS teaching plates</b>. Each one shows a Part 9 Article. They were drawn from the code text to help you see the math, but a plate is not the code. The book prints the drawing part of a plate and writes the requirement under it, with each value quoted from the code text. <b>The code text governs.</b> If a plate and the code ever seem to disagree, follow the code text.',
        'The full set of ' + (nPlates ? nPlates + ' ' : '') + 'plates is in the <b>bcbc</b> folder of the ACCESS Indigenous Skills4Success Numeracy site, the same site as the Numeracy Hub. There is one folder for each Section of Part 9 and one file for each Article, named with the Article number and title, for example “' + a1.num + ' ' + a1.title + '”.') +
      B.watch('Check the code that applies to your job', 'BCBC 2024 took effect on March 8, 2024. The order that set it up lets some work carry on under the 2018 code, for example work under a building permit applied for before that date. Before you rely on a value on the job, check which code applies to your project.') +
      '</section>'
    return cover + about + toc + howto + bcbc;
  }
  /* ---------- back matter ---------- */
  const id = 'bm-' + Math.random().toString(36).slice(2, 7);
  B.toc.push({ level: 'b', id: 'bm-formulas', title: 'Formula sheet' });
  B.toc.push({ level: 'b', id: 'bm-units', title: 'Conversion factors' });
  B.toc.push({ level: 'b', id: 'bm-gloss', title: 'Glossary' });
  const f = (name, rows) => '<div class="keep" style="margin-bottom:8pt"><h4 style="color:var(--deep);margin:0 0 3pt">' + name + '</h4>' + rows.map(r => '<div style="display:flex;justify-content:space-between;border-bottom:0.6pt solid var(--line);padding:2pt 0"><span>' + r[0] + '</span><span class="m"><b>' + r[1] + '</b></span></div>').join('') + '</div>';
  const formulas = '<section class="backmatter" id="bm-formulas"><div class="chline">Formula sheet</div><div class="sechd">Formula sheet</div><h1 class="bm">Formula sheet</h1><div class="twocol">' +
    f('Order of operations', [['Brackets, Exponents, Division and Multiplication (left to right), Addition and Subtraction (left to right)', 'BEDMAS']]) +
    f('Perimeter and distance around', [['Rectangle', 'P = 2 × (l + w)'], ['Any shape with straight sides', 'P = sum of the sides'], ['Circle', 'C = π × D'], ['Diameter and radius', 'D = 2 × r']]) +
    f('Area', [['Rectangle', 'A = l × w'], ['Square', 'A = s²'], ['Parallelogram', 'A = b × h'], ['Triangle', 'A = b × h ÷ 2'], ['Trapezoid', 'A = (a + b) × h ÷ 2'], ['Circle', 'A = π × r²'], ['Ring (annulus)', 'A = π × (R² − r²)'], ['Curved side of a cylinder', 'A = π × D × h']]) +
    f('Volume', [['Rectangular prism', 'V = l × w × h'], ['Any prism or cylinder', 'V = base area × h'], ['Cylinder', 'V = π × r² × h'], ['Cone', 'V = π × r² × h ÷ 3'], ['Pyramid', 'V = base area × h ÷ 3'], ['Sphere', 'V = 4 ÷ 3 × π × r³']]) +
    f('Right triangles', [['Pythagorean theorem', 'c² = a² + b²'], ['Angles of a triangle', 'A + B + C = 180°'], ['Sine', 'sin θ = opposite ÷ hypotenuse'], ['Cosine', 'cos θ = adjacent ÷ hypotenuse'], ['Tangent', 'tan θ = opposite ÷ adjacent']]) +
    f('Percent and averages', [['Percent of a number', 'part = percent ÷ 100 × whole'], ['Percent', 'percent = part ÷ whole × 100'], ['Average', 'sum ÷ how many']]) +
    f('Kitchen math (Appendix A)', [['Scaling factor', 'new yield ÷ old yield'], ['New amount', 'old amount × scaling factor'], ['Yield percent', 'EP ÷ AP × 100'], ['Edible portion', 'EP = AP × yield percent ÷ 100'], ['Amount to buy', 'AP = EP ÷ (yield percent ÷ 100)']]) +
    '</div></section>';
  const U = require(path.join(S, 'units', 'gen.js'));
  const SRC = { wma: 'Weights and Measures Act', nist: 'NIST SP 811', sp1038: 'NIST SP 1038', npc: 'NPC 2025 conversion tables' };
  const keep = new Set(['km', 'cm', 'mm', 'cmmm', 'ml', 'g', 't', 'in', 'ft', 'yd', 'sixteenth', 'mmin', 'mft', 'm2mm2', 'm2cm2', 'ft2in2', 'in2', 'ft2', 'm2ft2', 'm3', 'lmm3', 'ft3in3', 'ft3', 'ft3gal', 'usgal', 'impgal', 'imp_us', 'limp', 'psi', 'kpapsi', 'bar', 'c2f', 'f2c', 'lb', 'kglb']);
  const rows = U.FACTORS.filter(x => keep.has(x.id)).map(x => [x.from, x.to, x.exact ? 'Exact' : 'Rounded' + (x.full ? ' (' + x.full + ')' : ''), SRC[x.src] || x.src]);
  const units = '<section class="backmatter2" id="bm-units"><div class="chline">Conversion factors</div><div class="sechd">Conversion factors</div><h1 class="bm">Conversion factors</h1>' +
    B.p('Exact factors are true by definition. Rounded factors are the exact value cut short. Keep the full exact factor on the calculator and round only the final answer.') +
    '<table class="t long" style="width:100%;font-size:8.8pt;table-layout:fixed"><colgroup><col style="width:17%"><col style="width:27%"><col style="width:33%"><col style="width:23%"></colgroup><thead><tr><th>From</th><th>To</th><th>Exact or rounded</th><th>Source</th></tr></thead><tbody>' + rows.map(r => '<tr>' + r.map(c => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>' +
    '<p class="small">Sources: Weights and Measures Act (Canada), Schedules I and II. NIST Special Publication 811, Guide for the Use of the International System of Units, Appendix B.8. NIST Special Publication 1038, The International System of Units (SI): Conversion Factors for General Use (2006), including the U.S. gallon of 231 cubic inches. National Plumbing Code of Canada 2025, conversion factor table (PDF page 245).</p></section>';
  const g = Object.values(B.glossary).sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));
  const gloss = '<section class="backmatter2 gloss" id="bm-gloss"><div class="chline">Glossary</div><div class="sechd">Glossary</div><h1 class="bm">Glossary</h1><dl>' +
    g.map(x => { const w = /^[A-Z][a-z]/.test(x.word) && !/^Pythagor/.test(x.word) ? x.word[0].toLowerCase() + x.word.slice(1) : x.word; return '<div class="gi"><dt>' + w + '</dt><dd>' + x.def + ' <span class="ref">' + (typeof x.ch === 'string' ? 'Appendix ' : 'Chapter ') + x.ch + '</span></dd></div>'; }).join('') + '</dl></section>';
  return formulas + units + gloss;
};
