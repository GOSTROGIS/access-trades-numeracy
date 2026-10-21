/* Front matter for the Exercise Book */
const fs = require('fs'), path = require('path');
module.exports = function (B, L, part) {
  if (part !== 'front') return '';
  const S = path.join(__dirname, '..', '..');
  const badge = require('./brand.js').badge();
  const art = '<div style="display:flex;gap:18pt;align-items:flex-end;justify-content:center">' +
    B.shape('rectangular-prism', { l: 160, w: 90, h: 70 }, { labels: 'none', width: '2in' }) +
    B.net('rectangular-prism', { l: 160, w: 90, h: 70 }, { labels: 'none', width: '2.4in' }) + '</div>';
  const cover = '<section class="cover"><div class="top"><div class="kicker">ACCESS Indigenous Skills4Success</div>' +
    '<h1>Trades <span>Numeracy</span><br>Exercise Book</h1><div class="bar"></div>' +
    '<div class="sub">Practice for every chapter of the Trades Numeracy Textbook: skills, shop problems and Shape Canvas drawings, in metric and imperial. For fabrication, pipe trades, millwright and carpentry pre-apprentices.</div></div>' +
    '<div class="art">' + art + '</div>' +
    '<div class="foot">' + badge + '<div class="ed">Skills for Success: Numeracy<br>Answers are in the Answer Key</div></div></section>';
  const toc = '<section class="toc pbr"><h1>Contents</h1><!--TOC--></section>';
  const how = '<section class="front howto pbp"><h1 class="bm" style="font-size:20pt">How to use this book</h1>' +
    B.p('Each chapter of this book matches the chapter with the same number in the Trades Numeracy Textbook. Work through the textbook chapter first, then use these exercises for more practice.',
      'Every chapter starts with three sets. Set A practises the skills one at a time. Set B puts them to work in shop problems. Set C uses Shape Canvas drawings: a red ? marks a hidden size to find, dashed lines break a part into simple shapes, and a solid shown beside its flat pattern is unfolded into its net.',
      'Show your work in the working box under each problem and write the answer on the answer line. Estimate first, then use your calculator. The keys for the TI-30Xa and the Sharp EL-531XT are shown in the textbook. Answers to every problem are in the Answer Key.',
      'Some chapters have more sets after Set C. A set marked <span class="nocalc">No calculator</span> is done by hand, the way the ACCESS math assessment is written. A set titled Carpentry and the BCBC puts the chapter to work in carpentry, the fourth trade in these books alongside fabrication, pipe trades and millwright. Its code values are quoted from the BC Building Code 2024 with the Article, Sentence and page, as the textbook explains on its page Using the BC Building Code.',
      'After Chapter 13 come two appendices. Appendix A, Kitchen Math, practises recipe scaling, cooking measures and food yield percent. Appendix B is a Practice Assessment: 40 problems by hand, in the same skill order as the ACCESS math assessment.') +
    B.canvas(B.shape('rectangle', { l: 1200, w: 600 }, { hide: ['w'], width: '2.6in' })) + '</section>';
  return cover + toc + how;
};
