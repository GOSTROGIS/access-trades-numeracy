/* Add response fields and persistence without rebuilding or changing the book's learning content. */
const fs = require('fs');
const path = require('path');
module.exports = function enhanceExerciseHtml(html) {
  const style = fs.readFileSync(path.join(__dirname, '../styles/exercise-responses.css'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, 'exercise-responses.js'), 'utf8');
  html = html.replace(/<style id="exercise-response-style">[\s\S]*?<\/style>/g, '')
    .replace(/<script id="exercise-response-script">[\s\S]*?<\/script>/g, '');
  return html.replace('</head>', '<style id="exercise-response-style">' + style + '</style></head>')
    .replace('</body>', '<script id="exercise-response-script">' + script + '</script></body>');
};
if (require.main === module) {
  const target = process.argv[2];
  if (!target) throw new Error('Usage: node source/book/engine/exercise-fillable.js <exercise-book-web.html>');
  const original = fs.readFileSync(target, 'utf8');
  if (!/class="wb wb-exercise"/.test(original)) throw new Error('Expected the exercise book web edition.');
  fs.writeFileSync(target, module.exports(original));
  console.log('Embedded fillable responses in ' + target);
}
