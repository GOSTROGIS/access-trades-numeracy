/* BCBC 2024 Part 9 plates (ACCESS series) and the code text they quote.

   Use in a chapter or exercise file:
     const PL = require('../engine/plates.js')
     PL.figure(B, '9.8.4.1', { crop: 'draw', width: '6.5in', caption: 'Rise is measured nosing to nosing.' })
     PL.article('9.8.4.1')   -> { num, title, section, subsection, page, text }   (text is the official code wording)
     PL.cite('9.8.4.1')      -> 'BCBC 2024, Division B, Article 9.8.4.1. (page 9-30)'
     PL.has('9.8.4.1')       -> true when a plate exists for that Article

   crop: 'full' is the whole 1600 x 1000 plate. 'draw' is the drawing area only (x 40 to 1000, y 150 to 935),
   leaving out the title bar and the code panel so the drawing prints large. An array [x, y, w, h] crops any box.
   Print size: full width of the drawing area at 6.5 in puts 12 px plate text near 6.1 pt, which the build's
   7 pt label pass then enlarges. Prefer 'draw' or a smaller crop in print. */
const fs = require('fs'), path = require('path')

const ROOT = path.join(__dirname, '..', 'bcbc')
const PLATES = path.join(ROOT, 'Part 9')
const ARTICLES = path.join(ROOT, 'articles.json')

let index = null, arts = null, seq = 0

/* the published repo keeps the plates at bcbc/<section>/<Article>.svg (short paths, so the ZIP extracts on Windows) */
const REPO_PLATES = path.join(__dirname, '..', '..', '..', 'bcbc')

function plateIndex() {
  if (index) return index
  index = {}
  /* the scratch copy names files "<Article> <Title>.svg", the published repo copy names them "<Article>.svg" */
  const local = fs.existsSync(PLATES)
  const root = local ? PLATES : REPO_PLATES
  const pattern = local ? /^(\d+(?:\.\d+)+)\s.*\.svg$/ : /^(\d+(?:\.\d+)+)\.svg$/
  if (!fs.existsSync(root)) return index
  for (const sec of fs.readdirSync(root)) {
    const dir = path.join(root, sec)
    if (!fs.statSync(dir).isDirectory()) continue
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(pattern)
      if (m) index[m[1]] = path.join(dir, f)
    }
  }
  return index
}

function articles() {
  if (arts) return arts
  arts = {}
  const a = JSON.parse(fs.readFileSync(ARTICLES, 'utf8'))
  for (const part of Object.keys(a)) for (const r of a[part]) arts[r.num] = r
  return arts
}

let pl = null
function labels() {
  if (!pl) pl = JSON.parse(fs.readFileSync(path.join(ROOT, 'pagelabels.json'), 'utf8'))
  return pl
}

function article(num) {
  const r = articles()[num]
  if (!r) throw new Error('No BCBC Article ' + num + ' in articles.json')
  const page = labels()[String(r.pdfpage)] || (r.pages && r.pages.length ? r.num.split('.')[0] + '-' + r.pages[0] : null)
  return { num: r.num, title: r.title, section: r.section, subsection: r.subsection, page, text: r.text }
}

function cite(num) {
  const a = article(num)
  return 'BCBC 2024, Division B, Article ' + a.num + '.' + (a.page ? ' (page ' + a.page + ')' : '')
}

const has = num => !!plateIndex()[num]

/* a nested <svg> (the ACCESS logo in the title bar) becomes an <image> with the same box, so the plate is one
   flat SVG element. The build's number-spacing pass skips SVG by matching the first closing tag, and a nested
   svg would end that match early. */
function flattenNested(s) {
  const first = s.indexOf('<svg')
  let i = s.indexOf('<svg', first + 4)
  while (i > 0) {
    const end = s.indexOf('</svg>', i)
    const el = s.slice(i, end + 6)
    const open = el.match(/^<svg\b([^>]*)>/)
    const attr = k => { const m = open[1].match(new RegExp('\\s' + k + '="([^"]*)"')); return m ? m[1] : null }
    const inner = el.slice(open[0].length, -6)
    const vb = attr('viewBox')
    const doc = '<svg xmlns="http://www.w3.org/2000/svg"' + (vb ? ' viewBox="' + vb + '"' : '') + '>' + inner + '</svg>'
    const img = '<image x="' + (attr('x') || 0) + '" y="' + (attr('y') || 0) + '" width="' + attr('width') + '" height="' + attr('height') +
      '" href="data:image/svg+xml;base64,' + Buffer.from(doc).toString('base64') + '"/>'
    s = s.slice(0, i) + img + s.slice(end + 6)
    i = s.indexOf('<svg', first + 4)
  }
  return s
}

/* the view box for o.crop: 'full' (or none), 'draw', or an [x, y, w, h] array */
function cropBox(o) {
  return o.crop === 'full' || !o.crop ? [0, 0, 1600, 1000] : o.crop === 'draw' ? [40, 150, 960, 785] : o.crop
}

/* each plate file read and flattened once: metadata and the web font import removed (the book loads the same fonts) */
const flat = {}
function flatPlate(num) {
  if (flat[num]) return flat[num]
  const file = plateIndex()[num]
  if (!file) throw new Error('No plate for BCBC Article ' + num)
  let s = fs.readFileSync(file, 'utf8')
  s = s.replace(/<metadata>[\s\S]*?<\/metadata>/g, '')
  s = s.replace(/@import url\([^)]*\)\x3b?/g, '')
  return (flat[num] = flattenNested(s))
}

/* the plate as inline SVG, with ids made unique so two plates can share a page */
function svg(num, o) {
  o = o || {}
  let s = flatPlate(num)
  const tag = 'pl' + (++seq) + '-'
  s = s.replace(/\bid="([^"]+)"/g, 'id="' + tag + '$1"')
  s = s.replace(/url\(#([^)]+)\)/g, 'url(#' + tag + '$1)')
  s = s.replace(/(xlink:)?href="#([^"]+)"/g, (all, x, id) => (x || '') + 'href="#' + tag + id + '"')
  const box = cropBox(o)
  if (box[2] < 1600 || box[3] < 1000) s = require('./figs-ch08.js').pruneCrop(s, box)
  s = s.replace(/<svg\b([^>]*)>/, (all, attrs) => {
    attrs = attrs.replace(/\s(width|height|viewBox)="[^"]*"/g, '')
    return '<svg' + attrs + ' viewBox="' + box.join(' ') + '" width="100%" preserveAspectRatio="xMidYMid meet" class="bcbc-plate">'
  })
  return s
}

/* a numbered book figure. The caption always ends with the source line. */
function figure(B, num, o) {
  o = o || {}
  const cap = (o.caption ? o.caption + ' ' : '') + '<span class="src">Source: ' + cite(num) + '</span>'
  /* a set height, so the page layout knows the size of a cropped plate before it draws it, and one unbroken block */
  const box = cropBox(o)
  const wd = o.width || '6.5in'
  const w = /in$/.test(wd) ? parseFloat(wd) : 0
  const s = !w ? svg(num, o) : svg(num, o).replace('class="bcbc-plate">', 'class="bcbc-plate" style="height:' + (w * box[3] / box[2]).toFixed(2) + 'in">')
  return '<div style="break-inside:avoid">' + B.figure(s, cap, { width: o.width || '6.5in', cls: 'plate' }) + '</div>'
}

module.exports = { svg, figure, article, articles, cite, has, plateIndex }
