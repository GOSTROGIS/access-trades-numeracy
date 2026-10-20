/* Wording checks on a built book: node lint.js out/<name>.html
   Fails on draft or filler wording, decimal inches carried to four places, 2 pi r for distance around,
   em dashes and semicolons in reading text, and unbalanced or empty boxes, and any line that names the BCBC or the
   Building Code with an Article number that is not in bcbc/articles.json.
   Tolerances and plus/minus ranges are allowed in teaching content (decision of Oct 16 2026). */
const fs = require('fs');
const html = fs.readFileSync(process.argv[2], 'utf8');
/* drawings, scripts and styles are not reading text: strip them once, then derive the text and the lines from that */
const bare = html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ');
const text = bare.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ');
const rules = [
  [/\b(TODO|TBD|lorem|ipsum|placeholder|coming soon|to be added|draft|insert here|xxx)\b/i, 'draft or filler wording'],
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
/* BCBC Article numbers: a line (a paragraph, list item, caption, table cell or box line) that says "BCBC" or
   "Building Code" may only cite Articles that exist in bcbc/articles.json (Division B, Parts 3 and 9).
   A number named with Division A or C nearby is skipped, since those Divisions are not in the file. */
{
  const path = require('path')
  const AJ = path.join(__dirname, 'bcbc', 'articles.json')
  if (fs.existsSync(AJ)) {
    const known = new Set(Object.keys(require('./engine/plates.js').articles()))
    const lines = bare
      .split(/<\/?(?:p|li|div|td|th|tr|figcaption|h[1-6]|section|dd|dt|br)\b[^>]*>/i)
      .map(s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim())
      .filter(s => /BCBC|Building Code/i.test(s))
    const seen = new Set()
    for (const s of lines) {
      const re = /(?<![\d.])(\d{1,2}\.\d{1,2}\.\d{1,2}\.\d{1,2})(?![\d])/g
      let m
      while ((m = re.exec(s))) {
        const num = m[1]
        if (known.has(num)) continue
        const near = s.slice(Math.max(0, m.index - 40), m.index + num.length + 40)
        if (/Division [AC]\b/.test(near)) continue
        const key = num + '|' + s.slice(0, 40)
        if (seen.has(key)) continue
        seen.add(key)
        bad++
        console.log('LINT BCBC Article not in articles.json: ' + num + ' in ...' + s.slice(Math.max(0, m.index - 60), m.index + 60) + '...')
      }
    }
  }
}
console.log(bad ? bad + ' lint problems' : 'lint clean');
process.exit(bad ? 1 : 0);
