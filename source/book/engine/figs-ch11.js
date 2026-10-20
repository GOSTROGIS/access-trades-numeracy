/* Drawing kit for Chapter 11 additions (concrete, footings, slabs), textbook and exercise files.
   Usage: const G11 = require('../engine/figs-ch11.js')(B, L). Built on the Chapter 10 kit, so labels print at the
   same 7.5 pt and dimensions sit outside the parts. Sizes are in mm unless o.unit says otherwise. */
module.exports = function (B, L) {
  const G = require('./figs-ch10.js')(B, L)
  const { F, C, FS, frame, D, ask, sz } = G

  /* strip footing in section: footing fw wide and ft thick under a wall ww thick, centred. wh is the height of wall
     drawn (cut off above). Dimensions: footing width below, thickness at the right, wall thickness above, and the
     projection p on the left. o.ask: any of 'fw', 'ft', 'ww', 'p' */
  function footingSec(fw, ft, ww, o) {
    o = o || {}
    const wh = o.wh || Math.max(ft * 2.2, fw * 0.9), p = (fw - ww) / 2
    const f = frame(fw, ft + wh, { max: o.max || '2.4in', ph: o.ph || 120, pad: o.pad || [26, 34, 70, 36] }), P = f.P
    let h = F.poly([P(0, 0), P(fw, 0), P(fw, ft), P(0, ft)], { fill: C.fill, w: 2 })
    h += F.poly([P(p, ft), P(p + ww, ft), P(p + ww, ft + wh), P(p, ft + wh)], { fill: C.fill2, w: 2 })
    h += D(P(0, 0), P(fw, 0), sz(o, 'fw', fw), 20, ask(o, 'fw'))
    h += D(P(fw, 0), P(fw, ft), sz(o, 'ft', ft), 22, ask(o, 'ft'))
    h += D(P(p, ft + wh), P(p + ww, ft + wh), sz(o, 'ww', ww), -16, ask(o, 'ww'))
    if (o.showP && p > 0) h += D(P(0, ft), P(p, ft), ask(o, 'p') ? '?' : 'p', -14 - (wh * f.S) * 0.35, ask(o, 'p'))
    h += F.t(P(fw / 2, ft / 2)[0], P(fw / 2, ft / 2)[1] + 4, 'footing', { s: FS, c: C.dim, wgt: 600 })
    h += F.t(P(fw / 2, ft + wh * 0.55)[0], P(fw / 2, ft + wh * 0.55)[1] + 4, 'wall', { s: FS, c: C.dim, wgt: 600 })
    return f.out(h)
  }

  /* slab on ground in section: a strip of slab t thick on granular material g thick on soil. Lengths are drawn short.
     Dimensions on the right. o.ask: 't' or 'g' */
  function slabSec(t, g, o) {
    o = o || {}
    const len = o.len || (t + g) * 2.2, soil = g * 0.6
    const f = frame(len, t + g + soil, { max: o.max || '2.5in', ph: o.ph || 80, pad: o.pad || [14, 14, 86, 14] }), P = f.P
    let h = F.poly([P(0, 0), P(len, 0), P(len, soil), P(0, soil)], { fill: C.light, w: 1.2, c: C.dim })
    h += F.poly([P(0, soil), P(len, soil), P(len, soil + g), P(0, soil + g)], { fill: C.fill2, w: 1.6 })
    for (let i = 6; i < 9; i++) { const c = P(len * (i + 0.5) / 9, soil + g / 2); h += F.circle(c[0], c[1], Math.min(4, g * f.S * 0.18), { fill: C.white, w: 1, c: C.dim }) }
    h += F.poly([P(0, soil + g), P(len, soil + g), P(len, soil + g + t), P(0, soil + g + t)], { fill: C.fill, w: 2 })
    h += D(P(len, soil + g), P(len, soil + g + t), sz(o, 't', t), 18, ask(o, 't'))
    h += D(P(len, soil), P(len, soil + g), sz(o, 'g', g), 18, ask(o, 'g'))
    h += F.t(P(len * 0.3, 0)[0], P(0, soil + g + t / 2)[1] + 4, 'concrete slab', { s: FS, c: C.ink, wgt: 600 })
    h += F.t(P(len * 0.3, 0)[0], P(0, soil + g / 2)[1] + 4, 'granular layer', { s: FS, c: C.ink, wgt: 600 })
    h += F.t(P(len * 0.3, 0)[0], P(0, soil * 0.5)[1] + 4, 'soil', { s: FS, c: C.dim, wgt: 600 })
    return f.out(h)
  }

  return { G, footingSec, slabSec }
}
