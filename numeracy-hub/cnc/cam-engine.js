/* Shared existing ACCESS CAM engine, extracted without duplicating its geometry algorithms. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./cad-engine.js'));
  else root.AccessCAM = factory(root.AccessCAD);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (CAD) {
const CAM = (() => {
  'use strict';
  const P = (x, y) => ({ x, y });
  const f = v => { const s = (Math.round(v * 10000) / 10000).toFixed(4).replace(/0+$/, ''); return s === '-0.' ? '0.' : s; };
  const sub = (a, b) => P(a.x - b.x, a.y - b.y), add = (a, b) => P(a.x + b.x, a.y + b.y), mul = (a, k) => P(a.x * k, a.y * k);
  const unit = v => { const L = Math.hypot(v.x, v.y) || 1; return P(v.x / L, v.y / L); };

  /* ---------- geometry helpers ---------- */
  function segDist(p, a, b) {
    const vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy;
    let t = L2 > 0 ? ((p.x - a.x) * vx + (p.y - a.y) * vy) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(a.x + vx * t - p.x, a.y + vy * t - p.y);
  }
  function edgesOf(polys) { const E = []; polys.forEach(pts => { for (let i = 0; i < pts.length; i++) E.push([pts[i], pts[(i + 1) % pts.length]]); }); return E; }
  function distTo(E, p) { let d = Infinity; for (const [a, b] of E) { const q = segDist(p, a, b); if (q < d) d = q; } return d; }
  function inside(E, p) { let c = false; for (const [a, b] of E) { if ((a.y > p.y) !== (b.y > p.y) && p.x < a.x + (p.y - a.y) * (b.x - a.x) / (b.y - a.y)) c = !c; } return c; }
  function tangentAt(s, atEnd) {
    if (s.t === 'L') return unit(sub(s.b, s.a));
    const th = s.a0 + (atEnd ? s.sw : 0), sg = s.sw > 0 ? 1 : -1;
    return P(-Math.sin(th) * sg, Math.cos(th) * sg);
  }
  function translateSeg(s, d) { return s.t === 'L' ? { t: 'L', a: add(s.a, d), b: add(s.b, d) } : { t: 'A', c: add(s.c, d), r: s.r, a0: s.a0, sw: s.sw }; }
  function orient(segs, wantCCW) {
    const pts = []; segs.forEach(s => CAD.flatten(s, 0.01).forEach(p => pts.push(p)));
    let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; }
    return (a > 0) === wantCCW ? segs.slice() : segs.slice().reverse().map(CAD.reverse);
  }
  // start the loop at the middle of its longest straight side (or longest arc)
  function splitAtBest(segs) {
    let best = -1, bestLen = -1, bestIsLine = false;
    segs.forEach((s, i) => { const L = CAD.segLen(s), isL = s.t === 'L'; if ((isL && !bestIsLine) || (isL === bestIsLine && L > bestLen)) { best = i; bestLen = L; bestIsLine = isL; } });
    const s = segs[best];
    let h1, h2;
    if (s.t === 'L') { const m = mul(add(s.a, s.b), 0.5); h1 = { t: 'L', a: s.a, b: m }; h2 = { t: 'L', a: m, b: s.b }; }
    else { h1 = { t: 'A', c: s.c, r: s.r, a0: s.a0, sw: s.sw / 2 }; h2 = { t: 'A', c: s.c, r: s.r, a0: s.a0 + s.sw / 2, sw: s.sw / 2 }; }
    return [h2].concat(segs.slice(best + 1), segs.slice(0, best), [h1]);
  }
  function segCode(s) {
    const e = CAD.end(s);
    if (s.t === 'L') return 'G01 X' + f(e.x) + ' Y' + f(e.y);
    const a = CAD.start(s);
    return (s.sw < 0 ? 'G02' : 'G03') + ' X' + f(e.x) + ' Y' + f(e.y) + ' I' + f(s.c.x - a.x) + ' J' + f(s.c.y - a.y);
  }

  function rdp(pts, tol) {
    if (pts.length < 3) return pts.slice();
    const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
    const st = [[0, pts.length - 1]];
    while (st.length) {
      const [i, j] = st.pop(); const a = pts[i], b = pts[j], L = Math.hypot(b.x - a.x, b.y - a.y);
      let dm = -1, km = -1;
      for (let m = i + 1; m < j; m++) { const d = L > 1e-12 ? Math.abs((pts[m].x - a.x) * (b.y - a.y) - (pts[m].y - a.y) * (b.x - a.x)) / L : Math.hypot(pts[m].x - a.x, pts[m].y - a.y); if (d > dm) { dm = d; km = m; } }
      if (dm > tol) { keep[km] = true; st.push([i, km], [km, j]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  /* ---------- feeds and speeds ---------- */
  function speeds(tool, mat, maxRpm) {
    const ref = tool.type === 'face' ? [mat.face, 2.0, mat.face[1] / 2] : tool.type === 'drill' ? [mat.drill, 0.201, mat.drill[1]] : tool.type === 'spot' ? [mat.spot, 0.5, mat.spot[1]] : [mat.em, 0.5, mat.em[2]];
    const [rv, rd, plunge0] = ref, dia = Math.max(tool.dia || rd, 0.01);
    const rpm = Math.max(100, Math.min(maxRpm, Math.round(rv[0] * rd / dia)));
    const k = rpm / rv[0];
    return { rpm, feed: Math.max(0.5, Math.round(rv[1] * k * 10) / 10), plunge: Math.max(0.3, Math.round(plunge0 * k * 10) / 10) };
  }

  /* ---------- mill ---------- */
  function genMill(job) {
    const W = [], L = [], mat = job.mat, top0 = 0;
    const names = job.ops.filter(o => o.op !== 'none').map(o => o.layer);
    const bb = CAD.layersBBox(job.layers, [...new Set(names)]);
    if (!bb) return { error: 'Choose an operation for at least one layer that has geometry.' };
    const m = job.margin;
    const shift = job.keepStockOrigin ? P(0, 0) : P(m - bb.minx, m - bb.miny);
    const stock = job.stock ? { x: job.stock.x, y: job.stock.y, z: job.stock.z } : { x: +(bb.maxx - bb.minx + 2 * m).toFixed(4), y: +(bb.maxy - bb.miny + 2 * m).toFixed(4), z: job.thick };
    const progShift = job.zero === 'drawing' ? P(0, 0) : shift;
    const wcs = job.zero === 'drawing' ? { 54: { dx: shift.x, dy: shift.y, dz: 0 } } : null;
    const top = job.faceDepth > 0 && job.faceTool ? -job.faceDepth : top0;
    const clear = top0 + 0.1;
    const tools = job.lib;
    const used = new Set();

    L.push('%', 'O' + String(job.progNo).padStart(5, '0') + ' (' + job.title + ')', '(GENERATED BY THE ACCESS CNC TRAINER FROM ' + job.file + ')',
      '(STOCK ' + f(stock.x) + ' X ' + f(stock.y) + ' X ' + f(stock.z) + ')',
      job.zero === 'drawing' ? '(G54 X0 Y0 = DRAWING ORIGIN, Z0 = TOP OF STOCK)' : '(G54 X0 Y0 = LOWER LEFT OF STOCK, Z0 = TOP OF STOCK)',
      '(MATERIAL: ' + mat.label.toUpperCase() + '. FEEDS AND SPEEDS ARE TRAINING VALUES)',
      'G20 G17 G40 G49 G80 G90 G94');

    const geo = segs => segs.map(s => translateSeg(s, progShift));
    let curTool = null, currentCutting = job.cutting, currentStep = null;
    function toolOn(tn, at) {
      const t = tools[tn]; if (!t) { W.push('T' + tn + ' is not in the tool library.'); return null; }
      used.add(tn);
      const sp = currentCutting || speeds(t, mat, job.maxRpm);
      if (curTool !== tn) {
        if (curTool !== null) toolOff();
        L.push('(' + t.name.toUpperCase().replace(/[()]/g, '') + ')', 'T' + tn + ' M06', 'G00 G90 G54 X' + f(at.x) + ' Y' + f(at.y), 'S' + sp.rpm + ' M03', 'G43 H' + String(tn).padStart(2, '0') + ' Z' + f(clear + 0.9) + ' M08', 'Z' + f(clear));
        curTool = tn;
      } else L.push('G00 X' + f(at.x) + ' Y' + f(at.y));
      return { t, sp };
    }
    function toolOff() { L.push('G00 Z1. M09', 'M05', 'G91 G28 Z0.', 'G90', 'M01'); curTool = null; }
    const levelsOf = (depth, step) => { const n = Math.max(1, Math.ceil(depth / Math.max(step, 0.005) - 1e-9)), out = []; for (let i = 1; i <= n; i++) out.push(top - depth * i / n); return out; };

    // The same stock-facing raster serves the legacy preparation option and ordered steps.
    // Ordered depths stay in the original stock coordinate frame; they never move G54.
    function faceTop(tn, depth, fromDepth, passDepth) {
      const t = tools[tn]; if (!t) return;
      const r = t.dia / 2, x0 = -(r + 0.2), x1 = stock.x + r + 0.2, step = t.dia * 0.75;
      const o = job.zero === 'drawing' ? mul(shift, -1) : P(0, 0);
      const y0 = Math.min(r * 0.6, stock.y / 2), ts = toolOn(tn, add(o, P(x0, y0)));
      const n = Math.max(1, Math.ceil((depth - fromDepth) / Math.max(passDepth, 0.005) - 1e-9));
      for (let pass = 1; pass <= n; pass++) {
        const z = -(fromDepth + (depth - fromDepth) * pass / n);
        let y = y0, dir = 1;
        if (pass > 1) L.push('G00 X' + f(o.x + x0) + ' Y' + f(o.y + y));
        L.push('(FACE THE TOP PASS ' + pass + ' OF ' + n + ' TO ORIGINAL Z' + f(z) + ')',
          'G01 Z' + f(z) + ' F' + ts.sp.plunge, 'X' + f(o.x + x1) + ' F' + ts.sp.feed);
        while (y + r < stock.y - 1e-6) {
          y = Math.min(y + step, stock.y - r * 0.6); dir = -dir;
          L.push('G00 Y' + f(o.y + y), 'G01 X' + f(o.x + (dir > 0 ? x1 : x0)));
          if (y >= stock.y - r * 0.6 - 1e-6) break;
        }
        L.push('G00 Z' + f(clear));
      }
    }
    if (job.faceDepth > 0 && job.faceTool) faceTop(job.faceTool, job.faceDepth, 0, job.faceStep || job.faceDepth);

    // ---- profile pass with G41 and quarter-arc lead in/out
    function profilePass(segsIn, side, tn, levels, E, label) {
      const t = tools[tn]; if (!t) return;
      const r = t.dia / 2, segs = splitAtBest(orient(segsIn, side === 'in'));
      let small = false;
      segs.forEach(s => { if (s.t === 'A' && s.sw > 0 && s.r < r - 1e-6) small = s.r; });
      if (small !== false) { W.push(label + ': a concave radius of ' + f(small) + ' is smaller than the tool radius (' + f(r) + '). The pass was left out. Pick a smaller tool.'); return; }
      // the tool centre runs r from the wall: check it stays r clear of every other boundary
      if (E) {
        let gouge = false;
        for (const s of segs) {
          const pts = CAD.flatten(s, 0.02), L0 = CAD.segLen(s);
          for (let i = 0; i < pts.length - 1 && !gouge; i++) {
            const a = pts[i], b = pts[i + 1], m = mul(add(a, b), 0.5), u = unit(sub(b, a)), along = (i + 0.5) / (pts.length - 1) * L0;
            if (along < r * 1.05 || L0 - along < r * 1.05) continue;
            if (distTo(E, add(m, P(-u.y * r, u.x * r))) < r - 0.003) gouge = true;
          }
          if (gouge) break;
        }
        if (gouge) { W.push(label + ': the ' + f(t.dia) + ' tool does not fit between this wall and the next one. The pass was left out. Pick a smaller tool.'); return; }
      }
      const Pt = CAD.start(segs[0]), tg = tangentAt(segs[0], false), n = P(-tg.y, tg.x);
      let rho = r + 0.1, lin = 0.1;
      if (E && side === 'in') {
        while (rho > r + 0.021 && distTo(E, add(Pt, mul(n, rho))) < rho - 1e-4) rho -= 0.01;
        if (distTo(E, add(Pt, mul(n, rho))) < rho - 1e-4) W.push(label + ': there is little room for the lead-in arc. Check the start of the finish pass.');
      }
      const Q = add(Pt, mul(n, rho)), B = sub(Q, mul(tg, rho)), D = add(Q, mul(tg, rho));
      if (E && side === 'in') while (lin > 0.02 && distTo(E, add(B, mul(n, lin))) < r) lin -= 0.01;
      const A = add(B, mul(n, lin)), Eo = add(D, mul(n, lin));
      const ts = toolOn(tn, A);
      let prev = top;
      levels.forEach((z, i) => {
        L.push('(' + label + ' Z' + f(z) + ')');
        if (i) L.push('G00 X' + f(A.x) + ' Y' + f(A.y));
        L.push('G00 Z' + f(Math.min(clear, prev + 0.05)), 'G01 Z' + f(z) + ' F' + ts.sp.plunge,
          'G41 D' + String(tn).padStart(2, '0') + ' G01 X' + f(B.x) + ' Y' + f(B.y) + ' F' + ts.sp.feed,
          'G03 X' + f(Pt.x) + ' Y' + f(Pt.y) + ' I' + f(Q.x - B.x) + ' J' + f(Q.y - B.y));
        segs.forEach(s => L.push(segCode(s)));
        L.push('G03 X' + f(D.x) + ' Y' + f(D.y) + ' I' + f(Q.x - Pt.x) + ' J' + f(Q.y - Pt.y), 'G40 G01 X' + f(Eo.x) + ' Y' + f(Eo.y), 'G00 Z' + f(clear));
        prev = z;
      });
    }

    // ---- pocket: zigzag rough inside the region, then finish each wall
    function pocket(op, contours, tn) {
      const t = tools[tn]; if (!t) return;
      const r = t.dia / 2, allow = op.finish ? 0.01 : 0, rr = r + allow;
      const segsList = contours.map(c => geo(c.segs));
      const polys = segsList.map(segs => { const pts = []; segs.forEach((s, i) => { const fl = CAD.flatten(s, 0.005); (i ? fl.slice(1) : fl).forEach(p => pts.push(p)); }); pts.pop(); return pts; });
      const E = edgesOf(polys);
      const pb = CAD.bbox([].concat(...polys));
      const so = Math.max(0.01, t.dia * (op.stepover || 50) / 100);
      const yLo = pb.miny + rr, yHi = pb.maxy - rr;
      const rows = []; if (yHi < yLo) rows.push((pb.miny + pb.maxy) / 2); else { const n = Math.max(1, Math.ceil((yHi - yLo) / so)); for (let i = 0; i <= n; i++) rows.push(yLo + (yHi - yLo) * i / n); }
      const valid = p => inside(E, p) && distTo(E, p) >= rr - 1e-7;
      const runs = [];
      rows.forEach((y, ri) => {
        const near = E.filter(([a, b]) => Math.min(a.y, b.y) - rr <= y && Math.max(a.y, b.y) + rr >= y);
        const xs = []; E.forEach(([a, b]) => { if ((a.y > y) !== (b.y > y)) xs.push(a.x + (y - a.y) * (b.x - a.x) / (b.y - a.y)); }); xs.sort((p, q) => p - q);
        const ok = x => distTo(near, P(x, y)) >= rr - 1e-7;
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const x0 = xs[k], x1 = xs[k + 1], h = 0.01, n = Math.max(2, Math.ceil((x1 - x0) / h));
          let runStart = null, lastOk = null;
          const refine = (bad, good) => { for (let it = 0; it < 14; it++) { const mid = (bad + good) / 2; if (ok(mid)) good = mid; else bad = mid; } return good; };
          for (let s = 0; s <= n; s++) {
            const x = x0 + (x1 - x0) * s / n, v = s > 0 && s < n && ok(x);
            if (v && runStart === null) runStart = refine(x0 + (x1 - x0) * (s - 1) / n, x);
            if (v) lastOk = x;
            if (!v && runStart !== null) { const xe = refine(x, lastOk); runs.push({ y, ri, a: Math.min(runStart, xe), b: Math.max(runStart, xe) }); runStart = null; }
          }
        }
      });
      const label = 'POCKET ' + op.layer.toUpperCase();
      if (!runs.length) { W.push(label + ': the ' + f(t.dia) + ' tool does not fit inside this pocket. Pick a smaller tool.'); return; }
      // order runs: zigzag, link with a feed move when the straight link stays inside the cleared region
      const linkOk = (p, q) => { const n = Math.max(2, Math.ceil(Math.hypot(q.x - p.x, q.y - p.y) / 0.01)); for (let i = 1; i < n; i++) { const s = add(p, mul(sub(q, p), i / n)); if (!valid(s)) return false; } return true; };
      const left = runs.slice(), path = [];
      let cur = left.shift(), dir = 1;
      path.push({ a: P(cur.a, cur.y), b: P(cur.b, cur.y), link: false });
      while (left.length) {
        const end = path[path.length - 1].b;
        let bi = -1, bd = Infinity, bFlip = false, bLink = false;
        left.forEach((rn, i) => {
          [[P(rn.a, rn.y), false], [P(rn.b, rn.y), true]].forEach(([p, flip]) => {
            const d = Math.hypot(p.x - end.x, p.y - end.y), lk = d < so * 1.6 && linkOk(end, p);
            const score = d + (lk ? 0 : 100);
            if (score < bd) { bd = score; bi = i; bFlip = flip; bLink = lk; }
          });
        });
        const rn = left.splice(bi, 1)[0];
        path.push(bFlip ? { a: P(rn.b, rn.y), b: P(rn.a, rn.y), link: bLink } : { a: P(rn.a, rn.y), b: P(rn.b, rn.y), link: bLink });
        dir = -dir;
      }
      const levels = levelsOf(op.depth, op.step);
      const ts = toolOn(tn, path[0].a);
      let prev = top;
      levels.forEach((z, li) => {
        L.push('(' + label + ' ROUGH Z' + f(z) + ')');
        if (li) L.push('G00 X' + f(path[0].a.x) + ' Y' + f(path[0].a.y));
        L.push('G00 Z' + f(Math.min(clear, prev + 0.05)), 'G01 Z' + f(z) + ' F' + ts.sp.plunge, 'G01 X' + f(path[0].b.x) + ' Y' + f(path[0].b.y) + ' F' + ts.sp.feed);
        for (let i = 1; i < path.length; i++) {
          const s = path[i];
          if (s.link) L.push('G01 X' + f(s.a.x) + ' Y' + f(s.a.y));
          else L.push('G00 Z' + f(clear), 'X' + f(s.a.x) + ' Y' + f(s.a.y), 'Z' + f(Math.min(clear, prev + 0.05)), 'G01 Z' + f(z) + ' F' + ts.sp.plunge, 'F' + ts.sp.feed);
          L.push('G01 X' + f(s.b.x) + ' Y' + f(s.b.y));
        }
        L.push('G00 Z' + f(clear));
        prev = z;
      });
      if (op.finish) {
        const Eraw = edgesOf(polys);
        segsList.forEach((segs, i) => {
          const probe = CAD.flatten(segs[0], 0.01)[0];
          let depthIn = 0; polys.forEach((pp, j) => { if (j !== i && inside(edgesOf([pp]), probe)) depthIn++; });
          profilePass(segs, depthIn % 2 === 0 ? 'in' : 'out', tn, levels, Eraw, label + (depthIn % 2 ? ' ISLAND' : ' WALL') + ' FINISH');
        });
      }
    }

    // ---- spot and drill
    function drill(op, layer) {
      const holes = layer.circles.map(c => ({ p: add(c.c, progShift), d: c.r * 2 })).concat(layer.points.map(p => ({ p: add(p, progShift), d: null })));
      if (!holes.length) { W.push('DRILL ' + op.layer + ': this layer has no circles or points.'); return; }
      const order = [], left = holes.slice(); let at = P(0, 0);
      while (left.length) { let bi = 0, bd = Infinity; left.forEach((h, i) => { const d = Math.hypot(h.p.x - at.x, h.p.y - at.y); if (d < bd) { bd = d; bi = i; } }); const h = left.splice(bi, 1)[0]; order.push(h); at = h.p; }
      const dt = tools[op.tool]; if (!dt) return;
      const sizes = [...new Set(order.filter(h => h.d).map(h => h.d.toFixed(4)))];
      sizes.forEach(s => { if (Math.abs(+s - dt.dia) > 0.0005) W.push('DRILL ' + op.layer + ': the drawing has ' + s + ' holes. T' + op.tool + ' is ' + f(dt.dia) + '. Check the drill size.'); });
      if (op.spot && tools[op.spot]) {
        const st = tools[op.spot], half = ((st.ang || 90) / 2) * Math.PI / 180, ts = toolOn(op.spot, order[0].p);
        const spotD = Math.max(...order.map(h => h.d || dt.dia));
        const z = top - (spotD / 2 + 0.01) / Math.tan(half);
        L.push('(SPOT ' + order.length + ' HOLES, LAYER ' + op.layer.toUpperCase() + ')', 'G98 G81 Z' + f(z) + ' R' + f(clear) + ' F' + ts.sp.feed);
        order.slice(1).forEach(h => L.push('X' + f(h.p.x) + ' Y' + f(h.p.y)));
        L.push('G80');
      }
      const ts = toolOn(op.tool, order[0].p);
      L.push('(DRILL ' + order.length + ' HOLES ' + f(op.depth) + ' DEEP TO THE DRILL POINT)', 'G98 G83 Z' + f(top - op.depth) + ' R' + f(clear) + ' Q' + f(Math.max(dt.dia * 0.75, 0.05)) + ' F' + ts.sp.feed);
      order.slice(1).forEach(h => L.push('X' + f(h.p.x) + ' Y' + f(h.p.y)));
      L.push('G80');
    }

    // ---- engrave / follow the line with the tool centre
    function engrave(op, contours) {
      const tn = op.tool; if (!tools[tn]) return;
      const levels = levelsOf(op.depth, op.step);
      contours.forEach((c, ci) => {
        const segs = geo(c.segs), s0 = CAD.start(segs[0]), ts = toolOn(tn, s0);
        let prev = top;
        levels.forEach((z, li) => {
          L.push('(FOLLOW ' + op.layer.toUpperCase() + ' CONTOUR ' + (ci + 1) + ' Z' + f(z) + ')');
          if (li) L.push('G00 X' + f(s0.x) + ' Y' + f(s0.y));
          L.push('G00 Z' + f(Math.min(clear, prev + 0.05)), 'G01 Z' + f(z) + ' F' + ts.sp.plunge, 'F' + ts.sp.feed);
          segs.forEach(s => L.push(segCode(s)));
          L.push('G00 Z' + f(clear)); prev = z;
        });
      });
    }

    job.ops.forEach(op => {
      const layer = job.layers[op.layer]; if (!layer || op.op === 'none') return;
      if (op.stepId !== undefined && op.stepId !== currentStep) {
        if (curTool !== null) toolOff();
        L.push('(' + String(op.stepLabel || op.stepId).replace(/[^\x20-\x7e]|[()%]/g, ' ') + ')');
        currentStep = op.stepId;
      }
      currentCutting = op.cutting || job.cutting;
      const closed = layer.contours.filter(c => c.closed);
      const label = (op.op === 'profile-out' ? 'OUTSIDE PROFILE ' : 'INSIDE PROFILE ') + op.layer.toUpperCase();
      if (op.op === 'face') faceTop(op.tool, op.depth, op.fromDepth || 0, op.step || op.depth);
      else if (op.op === 'profile-out' || op.op === 'profile-in') {
        if (!closed.length) { W.push(label + ': this layer has no closed outlines.'); return; }
        const levels = levelsOf(op.depth, op.step);
        closed.forEach((c, i) => profilePass(geo(c.segs), op.op === 'profile-in' ? 'in' : 'out', op.tool, levels, edgesOf([geo(c.segs).reduce((acc, s, k) => acc.concat((k ? CAD.flatten(s, 0.005).slice(1) : CAD.flatten(s, 0.005))), [])]), label + (closed.length > 1 ? ' ' + (i + 1) : '')));
      } else if (op.op === 'pocket') {
        if (!closed.length) { W.push('POCKET ' + op.layer + ': this layer has no closed outlines.'); return; }
        pocket(op, closed, op.tool);
      } else if (op.op === 'drill') drill(op, layer);
      else if (op.op === 'engrave') engrave(op, layer.contours.filter(c => !c.circle || true));
      const allOpen = layer.contours.filter(c => !c.closed).length;
      if (allOpen && (op.op === 'pocket' || op.op.startsWith('profile'))) W.push(op.layer + ': ' + allOpen + ' open chain(s) were ignored. Close the outline in CAD, or use Follow line.');
    });
    if (curTool !== null) toolOff();
    L.push('G91 G28 Y0.', 'G90', 'M30', '%');
    return { text: L.join('\n'), stock, wcs, warnings: [...new Set(W)], toolsUsed: [...used] };
  }

  /* ---------- lathe ---------- */
  function genLathe(job) {
    const W = [], L = [], mat = job.mat, tools = job.lib;
    const layer = job.layers[job.layer];
    if (!layer || !layer.contours.length) return { error: 'The chosen layer has no profile.' };
    const c = layer.contours.slice().sort((a, b) => (b.bbox.maxx - b.bbox.minx) - (a.bbox.maxx - a.bbox.minx))[0];
    const onAxis = s => { const a = CAD.start(s), e = CAD.end(s); return Math.abs(a.y) < 1e-4 && Math.abs(e.y) < 1e-4; };
    let segs = c.segs.slice();
    if (c.closed) {
      const k = segs.findIndex(onAxis);
      if (k < 0) return { error: 'This closed outline does not sit on the centre line (Y0). Draw the upper half of the part with the centre line along X.' };
      segs = segs.slice(k + 1).concat(segs.slice(0, k + 1));
    }
    while (segs.length && onAxis(segs[segs.length - 1])) segs.pop();
    while (segs.length && onAxis(segs[0])) segs.shift();
    if (!segs.length) return { error: 'No profile is left after removing the centre line.' };
    if (CAD.start(segs[0]).x < CAD.end(segs[segs.length - 1]).x) segs = segs.reverse().map(CAD.reverse);
    // drop the front face (from the centre line up) and the back face (down to the centre line)
    while (segs.length > 1 && segs[0].t === 'L' && Math.abs(CAD.start(segs[0]).y) < 1e-4) segs.shift();
    while (segs.length > 1 && segs[segs.length - 1].t === 'L' && Math.abs(CAD.end(segs[segs.length - 1]).y) < 1e-4) segs.pop();
    const pts = []; segs.forEach(s => CAD.flatten(s, 0.005).forEach(p => pts.push(p)));
    if (pts.some(p => p.y < -1e-4)) return { error: 'Part of the profile is below the centre line. Draw only the upper half (Y = radius).' };
    const xmax = Math.max(c.bbox.maxx, ...pts.map(p => p.x)), xmin = Math.min(...pts.map(p => p.x));
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].x > pts[i - 1].x + 1e-5) return { error: 'The profile turns back toward the front face near Z' + f(pts[i].x - xmax) + '. G71 type I needs Z to keep moving toward the chuck. Undercuts like this need a back-turning tool.' };
    }
    // grooves: where the diameter drops below what is already reached nearer the front face
    let rh = 0; const hull = pts.map(p => { rh = Math.max(rh, p.y); return { x: p.x, y: rh }; });
    const grooves = []; let gs = -1;
    for (let i = 0; i <= pts.length; i++) {
      const low = i < pts.length && pts[i].y < hull[i].y - 1e-3;
      if (low && gs < 0) gs = i;
      if (!low && gs >= 0) { grooves.push({ s: gs - 1, e: Math.min(i, pts.length - 1) }); gs = -1; }
    }
    if (grooves.length && !(job.groove && tools[job.groove])) return { error: 'The profile has ' + grooves.length + ' groove(s), where the diameter gets smaller toward the chuck. Choose a groove tool so the trainer can rough and finish them.' };
    const frontOffset = job.frontOffset || 0;
    const Z = x => x - xmax - frontOffset, X = y => 2 * y;
    const maxDia = 2 * Math.max(...pts.map(p => p.y)), length = xmax - xmin;
    const stockDia = job.stock ? job.stock.dia : Math.ceil((maxDia + 0.05) / 0.0625) * 0.0625;
    const partW = job.part && tools[job.part] ? (tools[job.part].width || 0.12) : 0;
    const stock = job.stock ? { dia: job.stock.dia, stickout: job.stock.stickout, extra: job.stock.extra || 0 } : { dia: +stockDia.toFixed(4), stickout: +(length + partW + 0.6).toFixed(3), extra: job.face ? 0.03 : 0 };
    const spindle = kind => job.rpm ? 'G97 S' + job.rpm : 'G96 S' + mat[kind][0];
    const roughDepth = f(job.stepDown || 0.05);
    const clr = f(stockDia + 0.1);
    const two = job.gen === 'fanuc' || job.gen === 'mazatrol';
    L.push('%', 'O' + String(job.progNo).padStart(5, '0') + ' (' + job.title + ')', '(GENERATED BY THE ACCESS CNC TRAINER FROM ' + job.file + ')',
      '(BAR ' + f(stockDia) + ' DIA. Z0 = ' + (job.originalFront ? 'ORIGINAL STOCK FRONT' : 'FINISHED FACE') + '. X = DIAMETER)', '(MATERIAL: ' + mat.label.toUpperCase() + '. FEEDS AND SPEEDS ARE TRAINING VALUES)',
      'G18 G20 G40 G54 G80 G99', 'G28 U0. W0.', 'G50 S' + job.maxRpm);
    const tc = n => 'T' + String(n).padStart(2, '0') + String(n).padStart(2, '0');
    const profileStart = job.profileStart || 100, profileEnd = job.profileEnd || 200;
    const profileRange = 'P' + profileStart + ' Q' + profileEnd;
    const nm = n => '(' + (tools[n] ? tools[n].name.toUpperCase().replace(/[()]/g, '') : 'T' + n) + ')';
    const faceTool = job.faceTool || job.rough;
    if (job.face && tools[faceTool]) {
      const depth = job.faceDepth || 0, from = job.faceFrom || 0;
      const n = Math.max(1, Math.ceil((depth - from) / Math.max(job.faceStep || depth || 0.005, 0.005) - 1e-9));
      L.push('(FACE FROM ORIGINAL FRONT)', nm(faceTool), tc(faceTool), spindle('rough') + ' M03', 'G00 X' + clr + ' Z0.1 M08');
      for (let i = 1; i <= n; i++) {
        const z = -(from + (depth - from) * i / n);
        L.push('(FACE PASS ' + i + ' OF ' + n + ' TO ORIGINAL Z' + f(z) + ')',
          'G01 Z' + f(z) + ' F' + mat.finish[1], 'X-0.062', 'G00 Z0.1', 'X' + clr);
      }
      L.push('G28 U0. W0.', 'M01');
    }
    const s0 = CAD.start(segs[0]);
    const prof = ['N' + profileStart + ' G00 X' + f(X(s0.y)), 'G01 Z' + f(Z(s0.x)) + ' F' + mat.finish[1]];
    if (!grooves.length) {
      segs.forEach(s => {
        const e = CAD.end(s);
        if (s.t === 'L') prof.push('X' + f(X(e.y)) + ' Z' + f(Z(e.x)));
        else { const a = CAD.start(s); prof.push((s.sw < 0 ? 'G02' : 'G03') + ' X' + f(X(e.y)) + ' Z' + f(Z(e.x)) + ' I' + f(s.c.y - a.y) + ' K' + f(s.c.x - a.x)); prof.push('G01'); }
      });
      if (prof[prof.length - 1] === 'G01') prof.pop();
    } else {
      // G71/G70 follow the outside envelope. The grooves are cut afterwards with the grooving tool.
      rdp(hull, 0.0005).slice(1).forEach(p => prof.push('X' + f(X(p.y)) + ' Z' + f(Z(p.x))));
    }
    prof.push('N' + profileEnd + ' G01 X' + clr);
    if (tools[job.rough]) {
      L.push('(ROUGH WITH G71)', nm(job.rough), tc(job.rough), spindle('rough') + ' M03', 'G00 X' + clr + ' Z0.1 M08');
      if (two) L.push('G71 U' + roughDepth + ' R0.02', 'G71 ' + profileRange + ' U0.02 W0.005 F' + mat.rough[1]);
      else L.push('G71 ' + profileRange + ' U0.02 W0.005 D' + roughDepth + ' F' + mat.rough[1]);
      prof.forEach(x => L.push(x));
      L.push('G00 X' + clr + ' Z0.1', 'G28 U0. W0.', 'M01');
    }
    if (tools[job.finish]) {
      if (!tools[job.rough]) prof.forEach(x => L.push(x));
      L.push('(FINISH WITH G70)', nm(job.finish), tc(job.finish), spindle('finish') + ' M03', 'G00 X' + clr + ' Z0.1 M08', 'G70 ' + profileRange, 'G00 X' + clr + ' Z0.1 M09', 'G28 U0. W0.', 'M01');
    }
    if (grooves.length) {
      const gt = tools[job.groove], w = gt.width || 0.125;
      const rAt = z => { // profile radius at part Z (z <= 0), interpolated
        const x = z + xmax + frontOffset;
        for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (x <= a.x + 1e-9 && x >= b.x - 1e-9) { if (Math.abs(a.x - b.x) < 1e-9) return Math.max(a.y, b.y); return a.y + (b.y - a.y) * (a.x - x) / (a.x - b.x); } }
        return 0;
      };
      const spanMax = (zc) => { let m = 0; const a = zc - w + 1e-4, b = zc - 1e-4; for (let z = a; z <= b + 1e-9; z += 0.0025) m = Math.max(m, rAt(Math.min(z, b))); return Math.max(m, rAt(b)); };
      L.push('(GROOVES WITH ' + f(w) + ' WIDE GROOVING TOOL)', nm(job.groove), tc(job.groove), spindle('part') + ' M03', 'G00 X' + clr + ' Z0.1 M08');
      grooves.forEach((g, gi) => {
        const zF = Z(pts[g.s].x), zB = Z(pts[g.e].x), width = zF - zB, top = hull[g.s].y;
        const cl = f(2 * (top + 0.05));
        if (width < w - 1e-4) { W.push('Groove ' + (gi + 1) + ' at Z' + f(zF) + ' is ' + f(width) + ' wide. The grooving tool is ' + f(w) + ' wide, so the groove was left out. Use a narrower tool.'); return; }
        let bottom = Infinity; for (let i = g.s; i <= g.e; i++) bottom = Math.min(bottom, pts[i].y);
        L.push('(GROOVE ' + (gi + 1) + ': Z' + f(zF) + ' TO Z' + f(zB) + ', BOTTOM DIA ' + f(2 * bottom) + ')', 'G00 Z' + f(zF), 'X' + cl);
        const plunges = []; for (let z = zF; z > zB + w - 1e-6; z -= w * 0.8) plunges.push(z); if (!plunges.length || plunges[plunges.length - 1] > zB + w + 1e-6) plunges.push(zB + w);
        plunges.forEach(z => L.push('G00 Z' + f(z), 'G01 X' + f(2 * (spanMax(z) + 0.005)) + ' F' + mat.part[1], 'G00 X' + cl));
        const fin = []; for (let z = zF; z >= zB + w - 1e-6; z -= 0.01) fin.push({ x: z, y: spanMax(z) }); fin.push({ x: zB + w, y: spanMax(zB + w) });
        const fp = rdp(fin, 0.0005);
        L.push('G00 Z' + f(fp[0].x), 'G01 X' + f(2 * fp[0].y) + ' F' + mat.part[1]);
        fp.slice(1).forEach(p => L.push('X' + f(2 * p.y) + ' Z' + f(p.x)));
        L.push('G00 X' + cl);
      });
      L.push('G00 X' + clr + ' Z0.1 M09', 'G28 U0. W0.', 'M01');
    }
    if (job.part && tools[job.part]) {
      const cutZ = -(length + frontOffset), peck = job.partStep;
      L.push('(PART OFF AT ORIGINAL Z' + f(cutZ) + ', ' + f(length) + ' FROM FACED FRONT, ' + f(partW) + ' WIDE BLADE)',
        nm(job.part), tc(job.part), spindle('part') + ' M03', 'G00 X' + clr + ' Z0.1 M08', 'Z' + f(cutZ));
      if (peck > 0) {
        const n = Math.max(1, Math.ceil(((stockDia + 0.03) / 2) / peck - 1e-9));
        for (let i = 1; i <= n; i++) {
          const dia = i === n ? -0.03 : stockDia - (stockDia + 0.03) * i / n;
          L.push('(PART RADIAL PECK ' + i + ' OF ' + n + ')', 'G01 X' + f(dia) + ' F' + mat.part[1], 'G00 X' + clr);
        }
      } else L.push('G01 X-0.03 F' + mat.part[1], 'G00 X' + clr);
      L.push('Z0.1 M09', 'G28 U0. W0.');
    }
    if (stockDia > 6) W.push('The bar is ' + f(stockDia) + ' in. diameter. Check it fits the chuck of the selected lathe.');
    L.push('M30', '%');
    return { text: L.join('\n'), stock, warnings: W, length, maxDia, grooves: grooves.length };
  }

  return { genMill, genLathe, speeds };
})();

return CAM;
});
