/* Screen edition of a book: node build.js --book <kind> --web
   Takes the same assembled body the PDF build paginates and wraps it in one self-contained HTML file:
   fonts as woff2 data URIs, book.css plus styles/web.css inline, inline SVG drawings, a sticky contents menu,
   light and dark themes. No Paged.js, no network requests. Nothing in the body is removed: tables are wrapped
   in a scroll box so a wide table scrolls inside its own box on a phone. */
const fs = require('fs'), path = require('path')

/* styles/fonts.css with every woff2 url replaced by a data URI */
function fontsInline(root) {
  const dir = path.join(root, 'styles')
  const css = fs.readFileSync(path.join(dir, 'fonts.css'), 'utf8')
  return css.replace(/url\("([^"]+\.woff2)"\)/g, (all, rel) => {
    const fp = path.resolve(dir, rel)
    if (!fs.existsSync(fp)) throw new Error('web edition: font file missing ' + fp)
    return 'url("data:font/woff2' + String.fromCharCode(59) + 'base64,' + fs.readFileSync(fp).toString('base64') + '")'
  })
}

const ICON = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  print: '<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/>',
  moon: '<path d="M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.6 6.6 0 0 0 10 10z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>'
}
const icon = (k, cls) => '<svg class="ui' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[k] + '</svg>'

/* the contents menu, from the same toc list the printed contents page uses */
function navHtml(toc) {
  const item = e => {
    if (e.level === 's') return '<li><a class="nl s" href="#' + e.id + '"><span class="nn">' + e.num + '</span><span class="tx">' + e.title + '</span></a></li>'
    if (e.level === 'x') return '<li><a class="nl s" href="#' + e.id + '"><span class="nn">' + e.num + '</span><span class="tx">Exercise ' + e.num + ': ' + e.title + '</span></a></li>'
    return ''
  }
  let h = '<ol class="nroot">', open = false, kids = '', head = ''
  const flush = () => {
    if (!open) return
    h += kids ? head.replace('<!--T-->', '<button class="ntog" type="button" aria-expanded="false" aria-label="Show the parts of this chapter">' + icon('chev') + '</button>') + '<ol class="nsub">' + kids + '</ol></li>' : head.replace('<!--T-->', '') + '</li>'
    open = false
    kids = ''
  }
  toc.forEach(e => {
    if (e.level === 'c') {
      flush()
      open = true
      head = '<li class="nc"><div class="nrow"><a class="nl c" href="#' + e.id + '"><span class="nn">' + e.num + '</span><span class="tx">' + (e.app ? 'Appendix ' + e.num + ': ' : '') + e.title + '</span></a><!--T--></div>'
    } else if (e.level === 'b') {
      flush()
      h += '<li class="nc"><div class="nrow"><a class="nl c b" href="#' + e.id + '"><span class="tx">' + e.title + '</span></a></div></li>'
    } else if (open) kids += item(e)
    else h += item(e)
  })
  flush()
  return h + '</ol>'
}

/* wide tables scroll inside their own box */
function webBody(body) {
  return body.replace(/<table class="t[" ][\s\S]*?<\/table>/g, t => '<div class="tscroll" role="region" tabindex="0" aria-label="Table">' + t + '</div>')
}

/* runs in the head before the page paints: a saved theme choice */
function themeInit() {
  try {
    const t = localStorage.getItem('access-book-theme')
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t)
  } catch (e) { }
}

/* runs at the end of the body: contents drawer, theme toggle, print, and the current-section marker */
function uiScript() {
  const d = document, root = d.documentElement
  root.classList.add('js')
  const nav = d.getElementById('wnav'), scroller = nav.querySelector('.wnav-in')
  const navBtn = d.querySelector('.navbtn'), closeBtn = d.querySelector('.navclose'), scrim = d.querySelector('.scrim')
  const themeBtn = d.querySelector('.themebtn'), printBtn = d.querySelector('.printbtn')
  const narrow = window.matchMedia('(max-width: 1099px)')
  const darkQ = window.matchMedia('(prefers-color-scheme: dark)')

  function setOpen(v) {
    root.classList.toggle('nav-open', v)
    navBtn.setAttribute('aria-expanded', v ? 'true' : 'false')
    const a = v && (nav.querySelector('a.on') || nav.querySelector('a'))
    if (a) {
      revealLink(a)
      a.focus({ preventScroll: true })
    }
  }
  /* keep a menu link inside the menu's own scroll box */
  function revealLink(a) {
    const r = a.getBoundingClientRect(), s = scroller.getBoundingClientRect()
    if (r.top < s.top + 8 || r.bottom > s.bottom - 8) scroller.scrollTop += r.top - s.top - s.height / 3
  }
  function closeNav() {
    setOpen(false)
    navBtn.focus()
  }
  navBtn.addEventListener('click', () => setOpen(!root.classList.contains('nav-open')))
  closeBtn.addEventListener('click', closeNav)
  scrim.addEventListener('click', () => setOpen(false))
  d.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) closeNav()
  })
  narrow.addEventListener('change', () => setOpen(false))

  function toggleGroup(li, v) {
    li.classList.toggle('open', v)
    const b = li.querySelector('.ntog')
    if (b) b.setAttribute('aria-expanded', v ? 'true' : 'false')
  }
  nav.addEventListener('click', e => {
    const t = e.target.closest('.ntog')
    const li = t && t.closest('.nc')
    if (li) toggleGroup(li, !li.classList.contains('open'))
    else if (e.target.closest('a') && narrow.matches) setOpen(false)
  })

  /* theme: the saved choice wins, otherwise the system setting */
  const current = () => root.getAttribute('data-theme') || (darkQ.matches ? 'dark' : 'light')
  function paintTheme() {
    const dark = current() === 'dark'
    themeBtn.setAttribute('aria-pressed', dark ? 'true' : 'false')
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode')
    themeBtn.querySelector('.lbl').textContent = dark ? 'Light' : 'Dark'
  }
  themeBtn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try { localStorage.setItem('access-book-theme', next) } catch (e) { }
    paintTheme()
  })
  darkQ.addEventListener('change', paintTheme)
  paintTheme()
  printBtn.addEventListener('click', () => window.print())

  /* current-section marker in the menu */
  const links = Array.from(nav.querySelectorAll('a.nl'))
  const marks = links.map(a => ({ a, el: d.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))) })).filter(m => m.el)
  let active = null, queued = false
  const bar = d.querySelector('.wbar')
  function spy() {
    queued = false
    const line = bar.getBoundingClientRect().height + Math.min(160, window.innerHeight / 4)
    let lo = 0, hi = marks.length - 1, best = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (marks[mid].el.getBoundingClientRect().top <= line) {
        best = mid
        lo = mid + 1
      } else hi = mid - 1
    }
    const m = best >= 0 ? marks[best] : null
    if (m === active) return
    if (active) {
      active.a.classList.remove('on')
      active.a.removeAttribute('aria-current')
    }
    active = m
    if (!m) return
    m.a.classList.add('on')
    m.a.setAttribute('aria-current', 'location')
    const li = m.a.closest('.nc')
    nav.querySelectorAll('.nc.open').forEach(x => { if (x !== li) toggleGroup(x, false) })
    if (li) toggleGroup(li, true)
    revealLink(m.a)
  }
  function queue() {
    if (queued) return
    queued = true
    requestAnimationFrame(spy)
  }
  window.addEventListener('scroll', queue, { passive: true })
  window.addEventListener('resize', queue)
  spy()
}

module.exports = function (o) {
  const { body, B, meta, kind, root } = o
  const css = fontsInline(root) + '\n' + fs.readFileSync(path.join(root, 'styles', 'book.css'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'styles', 'web.css'), 'utf8')
  const title = meta.title + ' ' + meta.kind
  const desc = {
    textbook: 'Trades numeracy for ACCESS Indigenous Skills4Success pre-apprentices: whole numbers to trigonometry, with TI-30Xa and Sharp EL-531XT key steps.',
    exercise: 'Practice sets for every chapter of the ACCESS Indigenous Skills4Success Numeracy Textbook.',
    answers: 'Answers to the ACCESS Indigenous Skills4Success Numeracy Textbook and Exercise Book.'
  }[kind] || title
  const bar = '<header class="wbar">' +
    '<button class="wbtn navbtn" type="button" aria-controls="wnav" aria-expanded="false">' + icon('menu') + '<span class="lbl">Contents</span></button>' +
    '<a class="wbrand" href="#main"><span class="k">ACCESS Indigenous Skills4Success</span><span class="t">Numeracy ' + meta.kind + '</span></a>' +
    '<span class="wsp"></span>' +
    '<button class="wbtn printbtn" type="button" aria-label="Print this book">' + icon('print') + '<span class="lbl">Print</span></button>' +
    '<button class="wbtn themebtn" type="button" aria-pressed="false" aria-label="Switch to dark mode">' + icon('moon', 'i-moon') + icon('sun', 'i-sun') + '<span class="lbl">Dark</span></button>' +
    '</header>'
  const nav = '<nav class="wnav" id="wnav" aria-label="Contents"><div class="wnav-in">' +
    '<div class="wnav-hd"><span>Contents</span><button class="wbtn navclose" type="button" aria-label="Close the contents">' + icon('close') + '</button></div>' +
    '<ol class="nroot"><li class="nc"><div class="nrow"><a class="nl c b" href="#main"><span class="tx">Start of the ' + meta.kind.toLowerCase() + '</span></a></div></li></ol>' +
    navHtml(B.toc) + '</div></nav>'
  return '<!doctype html><html lang="en-CA"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="color-scheme" content="light dark">' +
    '<meta name="description" content="' + desc + '">' +
    '<title>' + title + '</title>' +
    '<link rel="icon" type="image/svg+xml" href="' + require('./brand.js').badgeUri() + '">' +
    '<script>(' + themeInit.toString() + ')()</script>' +
    '<style>' + css + '</style></head>' +
    '<body class="wb wb-' + kind + '"><a class="skip" href="#main">Skip to the book</a>' + bar +
    '<div class="wlayout">' + nav +
    '<main class="wmain" id="main" tabindex="-1"><div class="paper">' + webBody(body) + '</div></main></div>' +
    '<div class="scrim" aria-hidden="true"></div>' +
    '<script>(' + uiScript.toString() + ')()</script></body></html>'
}
