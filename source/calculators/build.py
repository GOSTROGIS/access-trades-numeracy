"""Builds the standalone ACCESS Trades calculator pages in this folder:
ti30xa.html, el531xt.html, hp15c.html (one calculator each) and calculators.html (all three with a switcher).
Each page is one offline file: the CalcKit build (calc2/calc-kit.js, the Numeracy Hub's own emulators), its styles,
the page styles, the fonts (woff2 data URIs) and the ACCESS logo are all inline.
Usage: python3 build.py"""
import os, json, base64, html
HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.dirname(HERE)
SRC = os.path.join(HERE, 'src')

def read(p):
    return open(p, encoding='utf-8').read()

kit = read(os.path.join(S, 'calc2', 'calc-kit.js'))
# the kit's styles go in the head as a static style element (the kit skips adding them when #calckit-css exists)
i = kit.index('var CSS = ') + len('var CSS = ')
j = kit.index(';\n', i)
kit_css = json.loads(kit[i:j])
assert '</' not in kit_css
kit_js = kit.replace('</script', '<\\/script')

FONTDIR = os.path.join(S, 'book', 'vendor', 'node_modules', '@fontsource')
FONTS = [('Archivo', 'archivo', 600), ('Archivo', 'archivo', 700),
         ('IBM Plex Sans', 'ibm-plex-sans', 400), ('IBM Plex Sans', 'ibm-plex-sans', 600), ('IBM Plex Sans', 'ibm-plex-sans', 700),
         ('IBM Plex Mono', 'ibm-plex-mono', 500), ('IBM Plex Mono', 'ibm-plex-mono', 600)]
font_css = ''
for fam, d, w in FONTS:
    p = os.path.join(FONTDIR, d, 'files', '%s-latin-%d-normal.woff2' % (d, w))
    b = base64.b64encode(open(p, 'rb').read()).decode('ascii')
    font_css += '@font-face { font-family: "%s"; font-style: normal; font-weight: %d; font-display: swap; src: url(data:font/woff2;base64,%s) format("woff2"); }\n' % (fam, w, b)

page_css = read(os.path.join(SRC, 'page.css'))
page_js = read(os.path.join(SRC, 'page.js')).replace('</script', '<\\/script')
logo_defs = read(os.path.join(S, 'brand', 'access-logo-defs.svg')).strip()
LOCKUP = ('<svg class="lockup" viewBox="35 30 205.2 102.9" role="img" aria-label="ACCESS">'
          '<g style="color:#FFBC00"><use href="#acc-gold"/></g><g style="color:#C60016"><use href="#acc-fig"/></g>'
          '<g style="color:#D2181F"><use href="#acc-word"/></g></svg>')
HOW = {m: read(os.path.join(SRC, 'how-%s.html' % m)).strip() for m in ['ti30xa', 'el531xt', 'hp15c']}
NAME = {'ti30xa': 'TI-30Xa', 'el531xt': 'Sharp EL-531XT', 'hp15c': 'HP-15C'}
FILE = {'ti30xa': 'ti30xa.html', 'el531xt': 'el531xt.html', 'hp15c': 'hp15c.html'}
OFFLINE = 'Everything is in this one file, so it works without an internet connection.'

PAGES = {
    'ti30xa': {
        'title': 'TI-30Xa calculator, ACCESS Trades',
        'h1': 'TI-30Xa calculator',
        'lede': 'A working TI-30Xa on screen. Press its keys or type on your keyboard. ' + OFFLINE,
        'desc': 'A working TI-30Xa calculator for ACCESS Trades numeracy.'},
    'el531xt': {
        'title': 'Sharp EL-531XT calculator, ACCESS Trades',
        'h1': 'Sharp EL-531XT calculator',
        'lede': 'A working Sharp EL-531XT on screen. Press its keys or type on your keyboard. ' + OFFLINE,
        'desc': 'A working Sharp EL-531XT calculator for ACCESS Trades numeracy.'},
    'hp15c': {
        'title': 'HP-15C calculator, ACCESS Trades',
        'h1': 'HP-15C calculator',
        'lede': 'A working HP-15C on screen, a calculator that uses RPN. Press its keys or type on your keyboard. ' + OFFLINE,
        'desc': 'A working HP-15C RPN calculator for ACCESS Trades numeracy.'},
    None: {
        'title': 'Calculators, ACCESS Trades',
        'h1': 'Calculators',
        'lede': ('Three working calculators in one file: the TI-30Xa, the Sharp EL-531XT and the HP-15C. Pick one below or with '
                 'the menu at the top of the calculator. Press its keys or type on your keyboard. ' + OFFLINE),
        'desc': 'Working TI-30Xa, Sharp EL-531XT and HP-15C calculators for ACCESS Trades numeracy.'},
}
RUN = ('Run on calculator presses the keys one at a time, and the key being pressed lights up. '
       'Speed, Jog and Hide operations on the calculator change how a run plays.')

def page(model):
    P = PAGES[model]
    if model:
        others = [m for m in ['ti30xa', 'el531xt', 'hp15c'] if m != model]
        bar = ('<nav class="wrap bar" aria-label="Other calculators" data-own-keys><span class="bar-l">Other calculators:</span>' +
               ''.join('<a href="%s">%s</a>' % (FILE[m], NAME[m]) for m in others) +
               '<a href="calculators.html">All three on one page</a></nav>')
        how = HOW[model]
        watch_p = 'Each example is written once and shown in this calculator&#8217;s own keys. ' + RUN
        body_cls = 'single'
    else:
        radios = ''.join('<label><input type="radio" name="calc-model" value="%s" autocomplete="off">%s</label>' % (m, NAME[m]) for m in ['ti30xa', 'el531xt', 'hp15c'])
        bar = ('<div class="wrap bar" data-own-keys><fieldset class="switch"><legend>Calculator</legend><div class="seg">' + radios + '</div></fieldset>'
               '<span class="bar-l">Each one also has its own file:</span>' +
               ''.join('<a href="%s">%s</a>' % (FILE[m], NAME[m]) for m in ['ti30xa', 'el531xt', 'hp15c']) + '</div>')
        parts = []
        for m in ['ti30xa', 'el531xt', 'hp15c']:
            parts.append(HOW[m] if m == 'ti30xa' else HOW[m].replace('<section class="panel how"', '<section class="panel how" hidden', 1))
        how = '\n'.join(parts)
        watch_p = ('Each example is written once and shown in the keys of the calculator you picked, the '
                   '<span id="model-name">TI-30Xa</span>. ' + RUN)
        body_cls = 'all'
    cfg = {'model': model, 'title': P['title']}
    out = '<!doctype html>\n<html lang="en-CA">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    out += '<title>%s</title>\n<meta name="description" content="%s">\n' % (html.escape(P['title']), html.escape(P['desc']))
    out += '<style>\n' + font_css + '</style>\n'
    out += '<style id="calckit-css">\n' + kit_css + '\n</style>\n'
    out += '<style>\n' + page_css + '</style>\n</head>\n'
    out += '<body class="%s">\n' % body_cls
    out += logo_defs + '\n'
    out += ('<header class="site-head"><div class="wrap head-inner">' + LOCKUP +
            '<div class="head-text"><p class="eyebrow">ACCESS Trades &#183; Skills for Success: Numeracy</p>'
            '<h1>%s</h1><p class="lede">%s</p></div></div></header>\n') % (html.escape(P['h1']), html.escape(P['lede']))
    out += bar + '\n'
    out += ('<main class="wrap layout">\n<div class="calc-col"><div id="calc-slot"></div></div>\n'
            '<div class="info-col" data-own-keys>\n' + how + '\n'
            '<section class="panel watch" aria-labelledby="watch-h"><h2 id="watch-h">Watch the keys</h2><p>' + watch_p + '</p>'
            '<div id="examples"></div></section>\n</div>\n</main>\n')
    out += '<script>window.CALC_PAGE = ' + json.dumps(cfg) + '\n</script>\n'
    out += '<script>\n' + kit_js + '\n</script>\n'
    out += '<script>\n' + page_js + '\n</script>\n</body>\n</html>\n'
    return out

for m, fn in [('ti30xa', 'ti30xa.html'), ('el531xt', 'el531xt.html'), ('hp15c', 'hp15c.html'), (None, 'calculators.html')]:
    s = page(m)
    # nothing is fetched: the only URL in a page is the SVG namespace
    rest = s.replace('http://www.w3.org/2000/svg', '')
    assert 'http://' not in rest and 'https://' not in rest, fn
    open(os.path.join(HERE, fn), 'w', encoding='utf-8').write(s)
    print('wrote', fn, len(s))
