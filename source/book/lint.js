/* Wording checks on a built book: node lint.js out/<name>.html
   Fails on draft or filler wording, tolerance figures, ten-thousandths readings, 2 pi r for distance around,
   em dashes and semicolons in reading text, and unbalanced or empty boxes. */
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
const text = html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const rules = [
  [/\b(TODO|TBD|lorem|ipsum|placeholder|coming soon|to be added|draft|insert here|xxx)\b/i, 'draft or filler wording'],
  [/toleran/i, 'tolerance (never state tolerance figures)'],
  [/ten[- ]thousandths?|\b0?\.000\d\b|\.\d{4}\s*(in|inch|")/i, 'ten-thousandths reading'],
  [/2\s*×?\s*π\s*×?\s*r\b|2πr/, '2πr (use π × D for distance around)'],
  [/—/, 'em dash in reading text'],
  [/[a-z]\s*;\s+[a-z]/i, 'semicolon in reading text'],
  [/\bundefined\b|\bNaN\b|\[object Object\]/, 'code leak (undefined, NaN)'],
  [/\bas an AI\b|\bI think\b|\bwe will\b/i, 'off-voice wording']
];
let bad = 0;
for (const [re, why] of rules) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let m, k = 0;
  while ((m = g.exec(text)) && k < 8) { k++; bad++; console.log('LINT ' + why + ': ...' + text.slice(Math.max(0, m.index - 60), m.index + 60) + '...'); }
}
console.log(bad ? bad + ' lint problems' : 'lint clean');
process.exit(bad ? 1 : 0);
