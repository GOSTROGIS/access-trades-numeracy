/* The IS4S badge (ACCESS Indigenous Skills4Success), the brand mark of the three books.
   brand/is4s-badge.svg is the master file (see brand/BRAND.md, section IS4S badge). It is read as it is, never
   recoloured or stretched: the drawing keeps its 1800 x 1650 view box and the page sets only its width.
   NAME is the organisation name used on the covers, in the document titles and in the web editions. */
const fs = require('fs'), path = require('path')

const NAME = 'ACCESS Indigenous Skills4Success'
const FILE = path.join(__dirname, '..', '..', 'brand', 'is4s-badge.svg')

let raw = null
function source() {
  if (raw == null) {
    if (!fs.existsSync(FILE)) throw new Error('IS4S badge missing: ' + FILE)
    raw = fs.readFileSync(FILE, 'utf8').trim()
  }
  return raw
}

/* the badge as inline SVG, for the cover footers. Its ids all start with is4s- and it appears once per book page. */
function badge() {
  return source().replace(/^<svg\b/, '<svg class="is4s" width="100%"')
}

/* the badge as a data URI, for the web editions' favicon */
function badgeUri() {
  return 'data:image/svg+xml' + String.fromCharCode(59) + 'base64,' + Buffer.from(source()).toString('base64')
}

module.exports = { NAME, badge, badgeUri }
