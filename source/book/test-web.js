/* Tests for the web editions: node test-web.js [textbook,exercise,answers]
   Checks contents links, console errors, network requests, sideways scroll at 390 x 844, light and dark at
   1280 x 900 and 390 x 844, and that the web file has the same examples, answers and calculator boxes as the
   PDF path's HTML of the same body (out/<book>-paged.html, which build.js --web writes beside the web file).
   Run node build.js --book <book> --web first. Screenshots go to out/web-shots/. */
const fs = require('fs'), path = require('path')
const { chromium } = require('/opt/npm-tools/node_modules/playwright')
const BK = __dirname, OUT = path.join(BK, 'out'), SHOTS = path.join(OUT, 'web-shots')
fs.mkdirSync(SHOTS, { recursive: true })
const books = (process.argv[2] || 'textbook,exercise,answers').split(',')
let checks = 0, fails = 0
const log = []
function ok(cond, what) {
  checks++
  if (!cond) { fails++; log.push('FAIL ' + what) }
  return cond
}

const COUNT = () => {
  const q = s => document.querySelectorAll(s).length
  return {
    examples: q('.ex'), exampleAnswers: q('.ex .a'), calcBoxes: q('.calc'), lcdDisplays: q('.lcd'), keyChips: q('.kc'),
    tryItems: q('.try li'), worksheetProblems: q('.prob'), worksheets: q('.ws'), canvases: q('.canvas'),
    answerKeyItems: q('ol.ak li'), answerKeyWorking: q('ol.ak .aw'), figures: q('figure'), tables: q('table.t'),
    drawings: q('svg:not(.ui)'), boxes: q('.box'), sections: q('h2.sec'), chapters: q('.ch-open, .ex-ch, .ak-ch'), glossary: q('.gloss .gi')
  }
}

async function main() {
  const br = await chromium.launch()
  for (const book of books) {
    const file = path.join(OUT, book + '-web.html')
    const url = 'file://' + file
    const sizeKB = Math.round(fs.statSync(file).size / 1024)
    log.push('== ' + book + ' (' + sizeKB + ' KB)')

    /* counts against the PDF path's HTML of the same body, parsed once */
    const ref = fs.readFileSync(path.join(OUT, book + '-paged.html'), 'utf8')
    const pg0 = await br.newPage()
    await pg0.goto('about:blank')
    const refCount = await pg0.evaluate(([h, f]) => { const doc = new DOMParser().parseFromString(h, 'text/html'); return (new Function('document', 'return (' + f + ')()'))(doc) }, [ref, COUNT.toString()])
    await pg0.close()

    for (const vp of [{ n: 'desktop', w: 1280, h: 900 }, { n: 'phone', w: 390, h: 844 }]) {
      for (const scheme of ['light', 'dark']) {
        const ctx = await br.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: scheme, deviceScaleFactor: vp.n === 'phone' ? 2 : 1 })
        const page = await ctx.newPage()
        const errs = [], net = []
        page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
        page.on('pageerror', e => errs.push(e.message))
        page.on('request', r => { const u = r.url(); if (u !== url && !u.startsWith('data:')) net.push(u) })
        await page.goto(url)
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(150)
        const tag = book + '-' + vp.n + '-' + scheme

        /* theme actually applied */
        const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
        const lum = bg.match(/\d+/g).slice(0, 3).reduce((a, b) => a + +b, 0) / 3
        ok(scheme === 'dark' ? lum < 60 : lum > 200, tag + ' background follows the theme (' + bg + ')')
        const fonts = await page.evaluate(() => Array.from(document.fonts).filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i).join(', '))
        ok(/Archivo/.test(fonts) && /IBM Plex Sans/.test(fonts), tag + ' fonts loaded from the file: ' + fonts)

        /* counts in the live page match the PDF build's HTML */
        if (vp.n === 'desktop' && scheme === 'light') {
          const c = await page.evaluate(COUNT)
          for (const k of Object.keys(refCount)) ok(c[k] === refCount[k], book + ' count ' + k + ': web ' + c[k] + ', PDF path HTML ' + refCount[k])
          log.push('   counts ' + JSON.stringify(c))
          const html = await page.content()
          ok(!/paged\.polyfill|PagedConfig|<script[^>]+src=/i.test(html), book + ' no Paged.js in the web file')
          ok(!/<link[^>]+href=|<script[^>]+src=|<img[^>]+src="http/i.test(fs.readFileSync(file, 'utf8')), book + ' no external stylesheet, script or image references')
        }

        /* sideways scroll: layout does not change with the theme, so it is checked once per viewport */
        if (scheme === 'light') {
          const sw = await page.evaluate(() => {
            const w = document.documentElement.clientWidth
            const bad = []
            document.querySelectorAll('.paper *').forEach(el => {
              if (el.closest('.tscroll') || el.closest('svg') && el.tagName.toLowerCase() !== 'svg') return
              const r = el.getBoundingClientRect()
              if (r.width && r.right > w + 1) bad.push((el.className && el.className.baseVal != null ? 'svg' : el.tagName.toLowerCase() + '.' + el.className) + ' ' + Math.round(r.right - w))
            })
            return { sw: document.documentElement.scrollWidth, w, bad: bad.slice(0, 8), nbad: bad.length }
          })
          ok(sw.sw <= sw.w, tag + ' no sideways scroll (scrollWidth ' + sw.sw + ', width ' + sw.w + ')')
          ok(sw.nbad === 0, tag + ' nothing wider than the screen outside scroll boxes: ' + sw.nbad + ' ' + sw.bad.join(' | '))
        }

        /* screenshots */
        await page.screenshot({ path: path.join(SHOTS, tag + '-top.png') })
        const firstOf = async sel => {
          const ok2 = await page.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView(); window.scrollBy(0, -70); return true }, sel)
          await page.waitForTimeout(120)
          return ok2
        }
        if (await firstOf(book === 'answers' ? '.ak-ch' : (book === 'exercise' ? '.ex-ch' : '#ch-4'))) await page.screenshot({ path: path.join(SHOTS, tag + '-chapter.png') })
        if (book === 'textbook' && await firstOf('#ch-4 ~ .ex .calc, .ex .calc')) await page.screenshot({ path: path.join(SHOTS, tag + '-calc.png') })
        if (book !== 'answers' && await firstOf('.ws')) await page.screenshot({ path: path.join(SHOTS, tag + '-worksheet.png') })
        if (book === 'textbook' && await firstOf('.tscroll')) await page.screenshot({ path: path.join(SHOTS, tag + '-table.png') })
        if (await firstOf('section.toc')) await page.screenshot({ path: path.join(SHOTS, tag + '-contents.png') })
        if (book === 'textbook' && await firstOf('#bm-units')) await page.screenshot({ path: path.join(SHOTS, tag + '-units.png') })
        if (book === 'textbook' && await firstOf('#bm-gloss')) await page.screenshot({ path: path.join(SHOTS, tag + '-glossary.png') })

        /* contents links: every menu link (desktop light) and every link of the printed contents page land on their target */
        if (scheme === 'light') {
          const navCount = await page.locator('#wnav a.nl').count()
          const tocCount = await page.locator('section.toc a').count()
          let navBad = [], tocBad = []
          const landed = async href => page.evaluate(h => {
            const id = decodeURIComponent(h.slice(1)), el = document.getElementById(id)
            if (!el) return 'missing ' + id
            if (location.hash !== h) return 'hash ' + location.hash + ' for ' + h
            const bar = document.querySelector('.wbar').getBoundingClientRect().height
            const top = el.getBoundingClientRect().top
            const atEnd = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2
            const wnav = document.getElementById('wnav')
            const navHidden = getComputedStyle(wnav).position !== 'fixed' || getComputedStyle(wnav).visibility === 'hidden'
            if (!navHidden) return 'drawer still open after ' + h
            if (id === 'main') return window.scrollY < 2 ? '' : 'not at top'
            if (top >= bar - 1 && top <= bar + 40) return ''
            if (atEnd && top >= bar - 1 && top < window.innerHeight) return ''
            return 'top ' + Math.round(top) + ' (bar ' + Math.round(bar) + ') for ' + h
          }, href)
          if (vp.n === 'desktop') {
            for (let i = 0; i < navCount; i++) {
              const a = page.locator('#wnav a.nl').nth(i)
              const href = await a.getAttribute('href')
              await a.evaluate(el => { const li = el.closest('.nc'); if (li && !li.classList.contains('open')) li.querySelector('.ntog') && li.querySelector('.ntog').click() })
              await a.click()
              const r = await landed(href)
              if (r) navBad.push(r)
            }
            ok(navBad.length === 0, tag + ' menu links land on their headings (' + navCount + ' links) ' + navBad.slice(0, 5).join(' | '))
          } else {
            /* phone: open the drawer and use it, for every chapter-level link and every part link of one chapter */
            const idx = await page.evaluate(() => {
              const all = Array.from(document.querySelectorAll('#wnav a.nl'))
              const firstGroup = document.querySelector('#wnav .nsub')
              return all.map((a, i) => ({ i, c: a.classList.contains('c'), g: !!firstGroup && firstGroup.contains(a) })).filter(x => x.c || x.g).map(x => x.i)
            })
            for (const i of idx) {
              const wasOpen = await page.evaluate(() => document.documentElement.classList.contains('nav-open'))
              if (wasOpen) navBad.push('drawer was still open before link ' + i)
              else await page.click('.navbtn')
              await page.waitForTimeout(260)
              const a = page.locator('#wnav a.nl').nth(i)
              const href = await a.getAttribute('href')
              await a.evaluate(el => { const li = el.closest('.nc'); if (li && !li.classList.contains('open') && li.querySelector('.ntog')) li.querySelector('.ntog').click() })
              await a.click({ timeout: 5000 }).catch(e => navBad.push('cannot click ' + href + ' ' + e.message.split(String.fromCharCode(10))[0]))
              await page.waitForTimeout(260)
              const r = await landed(href)
              if (r) navBad.push(r)
            }
            ok(navBad.length === 0, tag + ' drawer links land on their headings and close the drawer (' + idx.length + ' links) ' + navBad.slice(0, 5).join(' | '))
            await page.evaluate(() => window.scrollTo(0, 0))
            await page.click('.navbtn')
            await page.waitForTimeout(260)
            await page.screenshot({ path: path.join(SHOTS, tag + '-menu.png') })
            await page.keyboard.press('Escape')
            await page.waitForTimeout(260)
          }
          if (vp.n === 'desktop') {
            /* the printed contents page's links are clicked once, here */
            for (let i = 0; i < tocCount; i++) {
              const a = page.locator('section.toc a').nth(i)
              const href = await a.getAttribute('href')
              await a.click()
              const r = await landed(href)
              if (r) tocBad.push(r)
            }
            ok(tocBad.length === 0, tag + ' contents page links land on their headings (' + tocCount + ' links) ' + tocBad.slice(0, 5).join(' | '))
            await page.evaluate(() => { const e = document.getElementById('ch-2') || document.getElementById('ak-2'); if (e) e.scrollIntoView() })
            await page.waitForTimeout(150)
            await page.screenshot({ path: path.join(SHOTS, tag + '-menu.png') })
          }
        }

        /* the theme toggle flips the theme and is kept */
        const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
        await page.click('.themebtn')
        await page.waitForTimeout(80)
        const after = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, document.documentElement.getAttribute('data-theme'), document.querySelector('.themebtn').getAttribute('aria-pressed')])
        ok(after[0] !== before && after[1] === (scheme === 'dark' ? 'light' : 'dark') && after[2] === (scheme === 'dark' ? 'false' : 'true'), tag + ' theme toggle switches to ' + after[1])
        await page.reload()
        await page.waitForTimeout(80)
        const kept = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
        ok(kept === after[1], tag + ' theme choice kept after reload (' + kept + ')')
        await page.evaluate(() => { try { localStorage.removeItem('access-book-theme') } catch (e) { } })

        /* print media: bar and menu hidden, light colours */
        if (vp.n === 'desktop') {
          await page.emulateMedia({ media: 'print' })
          const pr = await page.evaluate(() => [getComputedStyle(document.querySelector('.wbar')).display, getComputedStyle(document.querySelector('.wnav')).display, getComputedStyle(document.body).backgroundColor, getComputedStyle(document.querySelector('.paper')).color])
          ok(pr[0] === 'none' && pr[1] === 'none' && pr[2] === 'rgb(255, 255, 255)' && pr[3] === 'rgb(26, 26, 26)', tag + ' print view hides the bar and menu and prints light: ' + JSON.stringify(pr))
          await page.emulateMedia({ media: 'screen' })
        }

        ok(errs.length === 0, tag + ' no console errors ' + errs.slice(0, 3).join(' | '))
        ok(net.length === 0, tag + ' no network requests ' + net.slice(0, 3).join(' | '))
        await ctx.close()
      }
    }
  }
  await br.close()
  console.log(log.join('\n'))
  console.log(checks + ' checks, ' + fails + ' failures')
  process.exit(fails ? 1 : 0)
}
main().catch(e => { console.error(e); process.exit(2) })
