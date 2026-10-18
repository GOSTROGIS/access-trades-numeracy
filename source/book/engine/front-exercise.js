/* Front matter for the Exercise Book */
const fs = require('fs'), path = require('path');
module.exports = function (B, L, part) {
  if (part !== 'front') return '';
  const S = path.join(__dirname, '..', '..');
  const lockup = fs.readFileSync(path.join(S, 'brand', 'access-lockup.svg'), 'utf8').replace(/width="410"/, 'width="100%"');
  const art = '<div style="display:flex;gap:18pt;align-items:flex-end;justify-content:center">' +
    B.shape('rectangular-prism', { l: 160, w: 90, h: 70 }, { labels: 'none', width: '2in' }) +
    B.net('rectangular-prism', { l: 160, w: 90, h: 70 }, { labels: 'none', width: '2.4in' }) + '</div>';
  const cover = '<section class="cover"><div class="top"><div class="kicker">ACCESS Trades</div>' +
    '<h1>Trades <span>Numeracy</span><br>Exercise Book</h1><div class="bar"></div>' +
    '<div class="sub">Practice for every chapter of the Trades Numeracy Textbook: skills, shop problems and Shape Canvas drawings, in metric and imperial.</div></div>' +
    '<div class="art">' + art + '</div>' +
    '<div class="foot">' + lockup + '<div class="ed">Skills for Success: Numeracy<br>Answers are in the Answer Key</div></div></section>';
  const toc = '<section class="toc pbr"><h1>Contents</h1><!--TOC--></section>';
  const how = '<section class="front howto pbp"><h1 class="bm" style="font-size:20pt">How to use this book</h1>' +
    B.p('Each chapter of this book matches the chapter with the same number in the Trades Numeracy Textbook. Work through the textbook chapter first, then use these exercises for more practice.',
      'Every chapter has three sets. Set A practises the skills one at a time. Set B puts them to work in shop problems. Set C uses Shape Canvas drawings: a red ? marks a hidden size to find, dashed lines break a part into simple shapes, and a solid shown beside its flat pattern is unfolded into its net.',
      'Show your work in the working box under each problem and write the answer on the answer line. Estimate first, then use your calculator. The keys for the TI-30Xa and the Sharp EL-531XT are shown in the textbook. Answers to every problem are in the Answer Key.') +
    B.canvas(B.shape('rectangle', { l: 1200, w: 600 }, { hide: ['w'], width: '2.6in' })) + '</section>';
  return cover + toc + how;
};
