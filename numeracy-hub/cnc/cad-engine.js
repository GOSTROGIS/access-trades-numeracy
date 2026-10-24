/* Shared existing ACCESS CAD engine, extracted without duplicating its geometry algorithms. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AccessCAD = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
const CAD = (() => {
  'use strict';
  const TAU = Math.PI * 2;
  const P = (x, y) => ({ x, y });

  /* ---------- segment helpers ---------- */
  // L: { t:'L', a, b }   A: { t:'A', c, r, a0, sw }  (sw > 0 = counterclockwise)
  function arcPt(s, f) { const th = s.a0 + s.sw * f; return P(s.c.x + s.r * Math.cos(th), s.c.y + s.r * Math.sin(th)); }
  function start(s) { return s.t === 'L' ? s.a : arcPt(s, 0); }
  function end(s) { return s.t === 'L' ? s.b : arcPt(s, 1); }
  function reverse(s) { return s.t === 'L' ? { t: 'L', a: s.b, b: s.a } : { t: 'A', c: s.c, r: s.r, a0: s.a0 + s.sw, sw: -s.sw }; }
  function segLen(s) { return s.t === 'L' ? Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y) : Math.abs(s.sw) * s.r; }
  function flatten(s, chord) {
    if (s.t === 'L') return [s.a, s.b];
    const n = Math.max(2, Math.ceil(Math.abs(s.sw) * s.r / (chord || 0.01)), Math.ceil(Math.abs(s.sw) / 0.2));
    const out = []; for (let i = 0; i <= n; i++) out.push(arcPt(s, i / n)); return out;
  }
  function bulgeArc(a, b, bulge) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (Math.abs(bulge) < 1e-9 || d < 1e-12) return { t: 'L', a, b };
    const th = 4 * Math.atan(bulge), k = d / 2 * (1 - bulge * bulge) / (2 * bulge);
    const c = P((a.x + b.x) / 2 - dy / d * k, (a.y + b.y) / 2 + dx / d * k);
    return { t: 'A', c, r: Math.hypot(a.x - c.x, a.y - c.y), a0: Math.atan2(a.y - c.y, a.x - c.x), sw: th };
  }

  /* ---------- transforms (blocks, OCS mirror, units) ---------- */
  function xform(item, T) {
    // T: { m: [a, b, c, d], tx, ty } maps p -> (a x + b y + tx, c x + d y + ty)
    const f = p => P(T.m[0] * p.x + T.m[1] * p.y + T.tx, T.m[2] * p.x + T.m[3] * p.y + T.ty);
    const det = T.m[0] * T.m[3] - T.m[1] * T.m[2];
    const o = Object.assign({}, item);
    if (item.point) { o.point = f(item.point); return o; }
    const s = item.seg;
    if (s.t === 'L') { o.seg = { t: 'L', a: f(s.a), b: f(s.b) }; return o; }
    const sx = Math.hypot(T.m[0], T.m[2]), sy = Math.hypot(T.m[1], T.m[3]);
    if (Math.abs(sx - sy) > 1e-6 * Math.max(sx, sy)) {
      // non-uniform scale turns arcs into ellipses: keep the shape as short lines
      o.seg = null; o.circle = false; o.poly = flatten(s, 0.002).map(f); return o;
    }
    const c = f(s.c), p0 = f(arcPt(s, 0));
    o.seg = { t: 'A', c, r: s.r * sx, a0: Math.atan2(p0.y - c.y, p0.x - c.x), sw: det < 0 ? -s.sw : s.sw };
    return o;
  }
  const IDENT = { m: [1, 0, 0, 1], tx: 0, ty: 0 };
  const MIRROR_X = { m: [-1, 0, 0, 1], tx: 0, ty: 0 };
  function compose(A, B) { // A after B
    return { m: [A.m[0] * B.m[0] + A.m[1] * B.m[2], A.m[0] * B.m[1] + A.m[1] * B.m[3], A.m[2] * B.m[0] + A.m[3] * B.m[2], A.m[2] * B.m[1] + A.m[3] * B.m[3]],
      tx: A.m[0] * B.tx + A.m[1] * B.ty + A.tx, ty: A.m[2] * B.tx + A.m[3] * B.ty + A.ty };
  }

  /* ---------- file sniffing ---------- */
  // DWG version strings from the Open Design Alliance DWG specification, section 3.2.1
  const DWG_VERSIONS = { AC1015: 'AutoCAD 2000', AC1018: 'AutoCAD 2004', AC1021: 'AutoCAD 2007', AC1024: 'AutoCAD 2010', AC1027: 'AutoCAD 2013', AC1032: 'AutoCAD 2018' };
  function sniff(name, bytes) {
    const ext = (name.includes('.') ? name.split('.').pop() : '').toLowerCase();
    const head = String.fromCharCode.apply(null, Array.from(bytes.slice(0, 24)));
    if (/^AC10\d\d/.test(head)) return { kind: 'dwg', version: head.slice(0, 6), release: DWG_VERSIONS[head.slice(0, 6)] || 'an older or unlisted release' };
    if (head.startsWith('AutoCAD Binary DXF')) return { kind: 'dxf', binary: true };
    if (ext === 'dxf') return { kind: 'dxf' };
    if (ext === 'svg') return { kind: 'svg' };
    if (ext === 'csv') return { kind: 'csv' };
    if (ext === 'stl') return { kind: 'stl' };
    if (['step', 'stp'].includes(ext)) return { kind: 'step' };
    if (['iges', 'igs'].includes(ext)) return { kind: 'iges' };
    if (['obj', '3mf', 'sldprt', 'ipt', 'f3d', 'x_t', 'dwf', 'pdf'].includes(ext)) return { kind: 'unsupported', ext };
    if (['nc', 'ngc', 'tap', 'txt', 'cnc', 'eia', 'gcode', 'min', 'mpf', 'iso', 'prg', 'g', ''].includes(ext)) return { kind: 'gcode' };
    const text = new TextDecoder().decode(bytes.slice(0, 4000));
    if (/^\s*0\s*\r?\n\s*SECTION/.test(text)) return { kind: 'dxf' };
    if (/<svg[\s>]/i.test(text)) return { kind: 'svg' };
    if (/[GM]\d/.test(text)) return { kind: 'gcode' };
    return { kind: 'unknown', ext };
  }

  /* ---------- DXF ---------- */
  // $INSUNITS values from the Autodesk DXF Reference header variables page
  const UNIT_NAMES = { 0: 'unitless', 1: 'inches', 4: 'millimetres', 5: 'centimetres', 6: 'metres' };
  const UNIT_TO_IN = { 1: 1, 4: 1 / 25.4, 5: 1 / 2.54, 6: 1 / 0.0254 };

  /* Binary DXF: a 22-byte sentinel, then group codes (2-byte little-endian from R13 on, 1 byte before)
     followed by values typed by group code range (Autodesk DXF Reference, Group Code Value Types). */
  function valueType(c) {
    if ((c >= 10 && c <= 59) || (c >= 110 && c <= 149) || (c >= 210 && c <= 239) || (c >= 460 && c <= 469) || (c >= 1010 && c <= 1059)) return 'd';
    if ((c >= 60 && c <= 79) || (c >= 170 && c <= 179) || (c >= 270 && c <= 289) || (c >= 370 && c <= 389) || (c >= 400 && c <= 409) || (c >= 1060 && c <= 1070)) return 'i16';
    if ((c >= 90 && c <= 99) || (c >= 420 && c <= 429) || (c >= 440 && c <= 459) || c === 1071) return 'i32';
    if (c >= 160 && c <= 169) return 'i64';
    if (c >= 290 && c <= 299) return 'b';
    if ((c >= 310 && c <= 319) || c === 1004) return 'bin';
    return 's';
  }
  function binaryDxfPairs(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), pairs = [];
    let p = 22;
    // R13+ files use 2-byte codes: the first pair is 0 / SECTION, so byte 23 is 0 in that case
    const wide = bytes[p + 1] === 0;
    const td = new TextDecoder('latin1');
    while (p < bytes.length - 1) {
      let code;
      if (wide) { code = dv.getInt16(p, true); p += 2; } else { code = bytes[p]; p += 1; if (code === 255) { code = dv.getInt16(p, true); p += 2; } }
      const t = valueType(code);
      let v;
      if (t === 'd') { v = String(dv.getFloat64(p, true)); p += 8; }
      else if (t === 'i16') { v = String(dv.getInt16(p, true)); p += 2; }
      else if (t === 'i32') { v = String(dv.getInt32(p, true)); p += 4; }
      else if (t === 'i64') { v = String(dv.getInt32(p, true)); p += 8; }
      else if (t === 'b') { v = String(bytes[p]); p += 1; }
      else if (t === 'bin') { const n = bytes[p]; p += 1 + n; v = ''; }
      else { let e = p; while (e < bytes.length && bytes[e] !== 0) e++; v = td.decode(bytes.subarray(p, e)); p = e + 1; }
      pairs.push([code, v]);
      if (code === 0 && v === 'EOF') break;
    }
    return pairs;
  }
  function textPairs(text) {
    const lines = text.split(/\r\n|\r|\n/);
    const pairs = [];
    for (let i = 0; i + 1 < lines.length; i += 2) {
      const code = parseInt(lines[i].trim(), 10);
      if (isNaN(code)) { i -= 1; continue; }
      pairs.push([code, lines[i + 1].replace(/^\s+|\s+$/g, '')]);
    }
    return pairs;
  }

  function parseDXF(src) {
    const pairs = typeof src === 'string' ? textPairs(src) : Array.isArray(src) ? src : binaryDxfPairs(src);
    const out = { insunits: null, acadver: null, items: [], skipped: {}, warnings: [] };
    const blocks = {};
    const skip = t => { out.skipped[t] = (out.skipped[t] || 0) + 1; };

    function readEntity(k) {
      const type = pairs[k][1], g = [];
      k++;
      while (k < pairs.length && pairs[k][0] !== 0) { g.push(pairs[k]); k++; }
      return { type, g, next: k };
    }
    const num = (g, code, def) => { const f = g.find(p => p[0] === code); return f ? parseFloat(f[1]) : def; };
    const str = (g, code, def) => { const f = g.find(p => p[0] === code); return f ? f[1] : def; };
    const all = (g, code) => g.filter(p => p[0] === code).map(p => parseFloat(p[1]));

    // an extrusion direction of (0,0,-1) mirrors the object coordinate system in X
    const ocsMirror = g => num(g, 230, 1) < 0;

    function entitiesToItems(ents, sink, depth) {
      for (let e = 0; e < ents.length; e++) {
        const { type, g } = ents[e];
        const layer = str(g, 8, '0');
        const mir = ocsMirror(g);
        const push = (item, ocs) => sink.push(ocs && mir ? xform(item, MIRROR_X) : item);
        if (type === 'LINE') push({ layer, seg: { t: 'L', a: P(num(g, 10, 0), num(g, 20, 0)), b: P(num(g, 11, 0), num(g, 21, 0)) } }, false);
        else if (type === 'CIRCLE') push({ layer, seg: { t: 'A', c: P(num(g, 10, 0), num(g, 20, 0)), r: num(g, 40, 0), a0: 0, sw: TAU }, circle: true }, true);
        else if (type === 'ARC') {
          const a0 = num(g, 50, 0) * Math.PI / 180, a1 = num(g, 51, 0) * Math.PI / 180;
          let sw = a1 - a0; while (sw <= 0) sw += TAU;
          push({ layer, seg: { t: 'A', c: P(num(g, 10, 0), num(g, 20, 0)), r: num(g, 40, 0), a0, sw } }, true);
        } else if (type === 'POINT') push({ layer, point: P(num(g, 10, 0), num(g, 20, 0)) }, false);
        else if (type === 'LWPOLYLINE') {
          const closed = (num(g, 70, 0) & 1) === 1, verts = [];
          g.forEach(([c, v]) => {
            if (c === 10) verts.push({ x: parseFloat(v), y: 0, b: 0 });
            else if (c === 20 && verts.length) verts[verts.length - 1].y = parseFloat(v);
            else if (c === 42 && verts.length) verts[verts.length - 1].b = parseFloat(v);
          });
          polyToItems(verts, closed, layer, mir, sink);
        } else if (type === 'POLYLINE') {
          const flags = num(g, 70, 0);
          const verts = [];
          while (e + 1 < ents.length && ents[e + 1].type === 'VERTEX') { e++; const vg = ents[e].g; verts.push({ x: num(vg, 10, 0), y: num(vg, 20, 0), b: num(vg, 42, 0) }); }
          if (e + 1 < ents.length && ents[e + 1].type === 'SEQEND') e++;
          if (flags & (16 | 64)) { skip('POLYLINE mesh'); continue; }
          polyToItems(verts, (flags & 1) === 1, layer, mir, sink);
        } else if (type === 'SPLINE') {
          const pts = splinePoints(g);
          if (pts.length < 2) { out.warnings.push('A spline on layer ' + layer + ' had no usable points and was skipped.'); continue; }
          for (let k = 1; k < pts.length; k++) sink.push({ layer, seg: { t: 'L', a: pts[k - 1], b: pts[k] }, fromCurve: 'spline' });
        } else if (type === 'ELLIPSE') {
          const c = P(num(g, 10, 0), num(g, 20, 0)), mj = P(num(g, 11, 1), num(g, 21, 0)), k = num(g, 40, 1);
          let t0 = num(g, 41, 0), t1 = num(g, 42, TAU); while (t1 <= t0) t1 += TAU;
          const mn = P(-mj.y * k, mj.x * k), n = Math.max(24, Math.ceil((t1 - t0) / TAU * 360));
          let prev = null;
          for (let s = 0; s <= n; s++) { const t = t0 + (t1 - t0) * s / n, p = P(c.x + mj.x * Math.cos(t) + mn.x * Math.sin(t), c.y + mj.y * Math.cos(t) + mn.y * Math.sin(t)); if (prev) sink.push({ layer, seg: { t: 'L', a: prev, b: p }, fromCurve: 'ellipse' }); prev = p; }
        } else if (type === 'INSERT') {
          const name = str(g, 2, ''), blk = blocks[name];
          if (!blk) { skip('INSERT of a missing block'); continue; }
          if (depth > 8) { out.warnings.push('Blocks nested more than 8 deep were not expanded.'); continue; }
          const sx = num(g, 41, 1), sy = num(g, 42, 1), rot = num(g, 50, 0) * Math.PI / 180;
          const cols = Math.max(1, num(g, 70, 1)), rows = Math.max(1, num(g, 71, 1)), cs = num(g, 44, 0), rs = num(g, 45, 0);
          const inner = []; entitiesToItems(blk.ents, inner, depth + 1);
          const cr = Math.cos(rot), sr = Math.sin(rot);
          for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
            let T = { m: [sx, 0, 0, sy], tx: -sx * blk.base.x + cc * cs, ty: -sy * blk.base.y + r * rs };
            T = compose({ m: [cr, -sr, sr, cr], tx: num(g, 10, 0), ty: num(g, 20, 0) }, T);
            if (mir) T = compose(MIRROR_X, T);
            inner.forEach(it => { const o = xform(it, T); if (it.layer === '0') o.layer = layer; sink.push(o); });
          }
        } else if (['SEQEND', 'VERTEX', 'ATTRIB', 'ATTDEF'].includes(type)) { /* read with their owner */ }
        else skip(type);
      }
    }
    function polyToItems(verts, closed, layer, mir, sink) {
      const n = verts.length; if (n < 2) return;
      const last = closed ? n : n - 1;
      for (let k = 0; k < last; k++) {
        const a = verts[k], b = verts[(k + 1) % n];
        if (Math.hypot(b.x - a.x, b.y - a.y) < 1e-12) continue;
        let it = { layer, seg: bulgeArc(P(a.x, a.y), P(b.x, b.y), a.b || 0) };
        if (mir) it = xform(it, MIRROR_X);
        sink.push(it);
      }
    }
    function splinePoints(g) {
      const deg = num(g, 71, 3), knots = all(g, 40), w = all(g, 41);
      const cx = all(g, 10), cy = all(g, 20), fx = all(g, 11), fy = all(g, 21);
      const ctrl = cx.map((x, k) => P(x, cy[k] || 0));
      if (ctrl.length > deg && knots.length === ctrl.length + deg + 1) {
        const W = ctrl.map((_, k) => (w.length === ctrl.length ? w[k] : 1));
        const u0 = knots[deg], u1 = knots[ctrl.length];
                const n = Math.min(1000, Math.max(ctrl.length * 12, 64));
        const pts = [];
        for (let s = 0; s <= n; s++) pts.push(deBoor(deg, knots, ctrl, W, u0 + (u1 - u0) * s / n, u1));
        return pts;
      }
      if (fx.length >= 2) { out.warnings.push('A spline was drawn through its fit points only (no control points were stored).'); return fx.map((x, k) => P(x, fy[k] || 0)); }
      return [];
    }
    function deBoor(p, U, C, W, u, uMax) {
      let k = p; while (k < C.length - 1 && !(u >= U[k] && u < U[k + 1])) k++;
      if (u >= uMax) k = C.length - 1;
      const d = []; for (let j = 0; j <= p; j++) { const c = C[j + k - p], wt = W[j + k - p]; d.push([c.x * wt, c.y * wt, wt]); }
      for (let r = 1; r <= p; r++) for (let j = p; j >= r; j--) {
        const den = U[j + 1 + k - r] - U[j + k - p]; const a = den === 0 ? 0 : (u - U[j + k - p]) / den;
        d[j] = [(1 - a) * d[j - 1][0] + a * d[j][0], (1 - a) * d[j - 1][1] + a * d[j][1], (1 - a) * d[j - 1][2] + a * d[j][2]];
      }
      return P(d[p][0] / d[p][2], d[p][1] / d[p][2]);
    }

    // header and blocks are read before entities so INSERTs can be expanded
    let section = null, i = 0;
    const entityList = [];
    while (i < pairs.length) {
      const [c, v] = pairs[i];
      if (c === 0 && v === 'SECTION') { section = (pairs[i + 1] || [])[1]; i += 2; continue; }
      if (c === 0 && v === 'ENDSEC') { section = null; i++; continue; }
      if (section === 'HEADER' && c === 9) {
        if (v === '$INSUNITS') out.insunits = parseInt((pairs[i + 1] || [0, '0'])[1], 10);
        if (v === '$ACADVER') out.acadver = (pairs[i + 1] || [0, ''])[1];
        i++; continue;
      }
      if (section === 'BLOCKS' && c === 0 && v === 'BLOCK') {
        const hdr = readEntity(i); i = hdr.next;
        const name = str(hdr.g, 2, ''), base = P(num(hdr.g, 10, 0), num(hdr.g, 20, 0)), ents = [];
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1] === 'ENDBLK')) { const en = readEntity(i); ents.push(en); i = en.next; }
        if (i < pairs.length) i = readEntity(i).next;
        blocks[name] = { base, ents };
        continue;
      }
      if (section === 'ENTITIES' && c === 0) { const en = readEntity(i); entityList.push(en); i = en.next; continue; }
      i++;
    }
    const raw = [];
    entitiesToItems(entityList, raw, 0);
    raw.forEach(it => {
      if (it.poly) { for (let k = 1; k < it.poly.length; k++) out.items.push({ layer: it.layer, seg: { t: 'L', a: it.poly[k - 1], b: it.poly[k] } }); }
      else out.items.push(it);
    });
    return out;
  }

  /* ---------- DWG: LibreDWG database (from loaders.js) rewritten as DXF group codes ---------- */
  function dwgToPairs(db) {
    const P2 = [], deg = r => r * 180 / Math.PI;
    const put = (c, v) => P2.push([c, String(v)]);
    const pt = (c, p) => { put(c, p ? p.x : 0); put(c + 10, p ? p.y : 0); };
    const records = (db.tables && db.tables.BLOCK_RECORD && db.tables.BLOCK_RECORD.entries) || [];
    const model = records.find(b => /^\*model_space$/i.test(b.name));
    function ent(e) {
      const L = e.layer || '0', neg = e.extrusionDirection && e.extrusionDirection.z < 0;
      const head = t => { put(0, t); put(8, L); };
      const ext = () => { if (neg) { put(210, 0); put(220, 0); put(230, -1); } };
      switch (e.type) {
        case 'LINE': head('LINE'); pt(10, e.startPoint); pt(11, e.endPoint); break;
        case 'CIRCLE': head('CIRCLE'); pt(10, e.center); put(40, e.radius); ext(); break;
        case 'ARC': head('ARC'); pt(10, e.center); put(40, e.radius); put(50, deg(e.startAngle)); put(51, deg(e.endAngle)); ext(); break;
        case 'POINT': head('POINT'); pt(10, e.position); break;
        case 'LWPOLYLINE': case 'POLYLINE2D': {
          const closed = e.type === 'LWPOLYLINE' ? (e.flag & 0x200) !== 0 : (e.flag & 1) !== 0;
          head('LWPOLYLINE'); put(70, closed ? 1 : 0); ext();
          (e.vertices || []).forEach(v => { put(10, v.x); put(20, v.y); if (v.bulge) put(42, v.bulge); });
          break;
        }
        case 'ELLIPSE': head('ELLIPSE'); pt(10, e.center); pt(11, e.majorAxisEndPoint); put(40, e.axisRatio); put(41, e.startAngle || 0); put(42, e.endAngle || Math.PI * 2); break;
        case 'SPLINE':
          head('SPLINE'); put(71, e.degree || 3);
          (e.knots || []).forEach(k => put(40, k)); (e.weights || []).forEach(w => put(41, w));
          (e.controlPoints || []).forEach(c => pt(10, c)); (e.fitPoints || []).forEach(c => pt(11, c));
          break;
        case 'INSERT':
          head('INSERT'); put(2, e.name); pt(10, e.insertionPoint); put(41, e.xScale || 1); put(42, e.yScale || 1); put(50, deg(e.rotation || 0));
          if (e.columnCount > 1) { put(70, e.columnCount); put(44, e.columnSpacing || 0); }
          if (e.rowCount > 1) { put(71, e.rowCount); put(45, e.rowSpacing || 0); }
          ext(); break;
        default: head(e.type || 'UNKNOWN');
      }
    }
    put(0, 'SECTION'); put(2, 'HEADER');
    if (db.header && db.header.INSUNITS !== undefined) { put(9, '$INSUNITS'); put(70, db.header.INSUNITS); }
    put(0, 'ENDSEC');
    put(0, 'SECTION'); put(2, 'BLOCKS');
    records.filter(b => !/^\*(model|paper)_space/i.test(b.name)).forEach(b => {
      put(0, 'BLOCK'); put(2, b.name); pt(10, b.basePoint);
      (b.entities || []).forEach(ent);
      put(0, 'ENDBLK');
    });
    put(0, 'ENDSEC');
    put(0, 'SECTION'); put(2, 'ENTITIES');
    (db.entities || []).filter(e => !model || e.ownerBlockRecordSoftId === model.handle).forEach(ent);
    put(0, 'ENDSEC'); put(0, 'EOF');
    return P2;
  }

  /* ---------- STL (ASCII or binary) and meshes ---------- */
  function parseSTL(bytes) {
    const head = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 512)));
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let tris;
    const nBin = bytes.length >= 84 ? dv.getUint32(80, true) : -1;
    if (nBin >= 0 && 84 + nBin * 50 === bytes.length) {
      tris = new Float32Array(nBin * 9);
      for (let t = 0; t < nBin; t++) for (let k = 0; k < 9; k++) tris[t * 9 + k] = dv.getFloat32(84 + t * 50 + 12 + k * 4, true);
    } else if (/^\s*solid/i.test(head)) {
      const txt = new TextDecoder('latin1').decode(bytes), v = [], re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g;
      let m; while ((m = re.exec(txt))) v.push(+m[1], +m[2], +m[3]);
      tris = new Float32Array(v.length - v.length % 9); tris.set(v.slice(0, tris.length));
    } else throw new Error('This STL file could not be read.');
    return { tris, name: 'stl' };
  }
  function meshFromOcct(res) {
    const all = [];
    (res.meshes || []).forEach(m => {
      const p = m.attributes.position.array, ix = m.index.array;
      for (let i = 0; i < ix.length; i++) { const k = ix[i] * 3; all.push(p[k], p[k + 1], p[k + 2]); }
    });
    return { tris: Float32Array.from(all), name: 'step' };
  }
  function meshBBox(tris) {
    const b = { minx: Infinity, miny: Infinity, minz: Infinity, maxx: -Infinity, maxy: -Infinity, maxz: -Infinity };
    for (let i = 0; i < tris.length; i += 3) {
      const x = tris[i], y = tris[i + 1], z = tris[i + 2];
      if (x < b.minx) b.minx = x; if (x > b.maxx) b.maxx = x; if (y < b.miny) b.miny = y; if (y > b.maxy) b.maxy = y; if (z < b.minz) b.minz = z; if (z > b.maxz) b.maxz = z;
    }
    return b;
  }
  // scale, then turn so the chosen axis points up (+Z)
  function orientMesh(tris, k, up) {
    const o = new Float32Array(tris.length);
    for (let i = 0; i < tris.length; i += 3) {
      let x = tris[i] * k, y = tris[i + 1] * k, z = tris[i + 2] * k;
      if (up === '+X') [x, y, z] = [-z, y, x]; else if (up === '-X') [x, y, z] = [z, y, -x];
      else if (up === '+Y') [x, y, z] = [x, -z, y]; else if (up === '-Y') [x, y, z] = [x, z, -y];
      else if (up === '-Z') [x, y, z] = [x, -y, -z];
      o[i] = x; o[i + 1] = y; o[i + 2] = z;
    }
    return o;
  }

  /* ---------- SVG (browser only: the live DOM flattens the paths) ---------- */
  const SVG_UNITS = { in: 1, mm: 1 / 25.4, cm: 1 / 2.54, pt: 1 / 72, pc: 1 / 6, px: 1 / 96 };
  function parseSVG(text, doc) {
    const out = { items: [], skipped: {}, warnings: [], insunits: 1 };
    const parsed = new DOMParser().parseFromString(text, 'image/svg+xml');
    const root = parsed.documentElement;
    if (!root || root.nodeName.toLowerCase() !== 'svg') { out.warnings.push('This SVG file could not be read.'); return out; }
    const host = doc.createElement('div');
    host.style.cssText = 'position:absolute;left:-10000px;top:0;width:10px;height:10px;overflow:hidden;visibility:hidden';
    host.appendChild(doc.importNode(root, true)); doc.body.appendChild(host);
    const svg = host.querySelector('svg');
    try {
      let k = 1 / 96; const wAttr = (svg.getAttribute('width') || '').trim(), m = /^([\d.]+)\s*(in|mm|cm|pt|pc|px)?$/.exec(wAttr);
      const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      if (m && vb.length === 4 && vb[2] > 0) k = parseFloat(m[1]) * SVG_UNITS[m[2] || 'px'] / vb[2];
      else if (m && m[2]) k = SVG_UNITS[m[2]];
      out.unitNote = m && m[2] ? 'taken from the width attribute (' + wAttr + ')' : 'assumed to be 96 px per inch';
      const rootInv = svg.getScreenCTM().inverse();
      svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon').forEach(el => {
        const g = el.closest('g[id]'), layer = (g && g.id) || 'svg';
        const ctm = rootInv.multiply(el.getScreenCTM());
        const map = p => { const q = p.matrixTransform(ctm); return P(q.x * k, -q.y * k); };
        const tag = el.nodeName.toLowerCase();
        if (tag === 'circle' && Math.abs(ctm.b) < 1e-9 && Math.abs(ctm.c) < 1e-9 && Math.abs(Math.abs(ctm.a) - Math.abs(ctm.d)) < 1e-9) {
          if (!(+el.getAttribute('r') > 0)) { out.warnings.push('A circle has a missing or non-positive radius.'); return; }
          const c = svg.createSVGPoint(); c.x = +el.getAttribute('cx') || 0; c.y = +el.getAttribute('cy') || 0;
          out.items.push({ layer, seg: { t: 'A', c: map(c), r: (+el.getAttribute('r') || 0) * Math.abs(ctm.a) * k, a0: 0, sw: TAU }, circle: true });
          return;
        }
        const len = el.getTotalLength ? el.getTotalLength() : 0;
        if (!(len > 0)) { out.warnings.push('An SVG ' + tag + ' has empty or invalid geometry.'); return; }
        const step = Math.max(len / 4000, 0.005 / k), n = Math.ceil(len / step);
        let prev = null;
        for (let s = 0; s <= n; s++) {
          const q = map(el.getPointAtLength(Math.min(len, s * step)));
          if (prev) {
            const d = Math.hypot(q.x - prev.x, q.y - prev.y);
            if (d > step * k * 3) { prev = q; continue; }       // jump between subpaths
            if (d > 1e-9) out.items.push({ layer, seg: { t: 'L', a: prev, b: q }, fromCurve: 'svg' });
          }
          prev = q;
        }
      });
    } finally { host.remove(); }
    return out;
  }

  /* ---------- CSV hole lists: x,y[,dia] ---------- */
  function parseCSV(text) {
    const out = { items: [], skipped: {}, warnings: [], insunits: 0 };
    text.split(/\r?\n/).forEach((ln, i) => {
      const f = ln.split(/[,;\t]/).map(s => s.trim()).filter(s => s !== '');
      if (f.length < 2) return;
      const v = f.slice(0, 3).map(Number);
      if (!isFinite(v[0]) || !isFinite(v[1])) { if (i > 0) out.warnings.push('Line ' + (i + 1) + ' was skipped: ' + ln.slice(0, 40)); return; }
      if (f.length >= 3 && isFinite(v[2]) && v[2] > 0) out.items.push({ layer: 'CSV holes', seg: { t: 'A', c: P(v[0], v[1]), r: v[2] / 2, a0: 0, sw: TAU }, circle: true });
      else out.items.push({ layer: 'CSV holes', point: P(v[0], v[1]) });
    });
    return out;
  }

  function scaleItems(items, k) {
    if (k === 1) return items;
    const T = { m: [k, 0, 0, k], tx: 0, ty: 0 };
    return items.map(it => xform(it, T));
  }

  /* ---------- chain segments into contours ---------- */
  function chain(items, tol, outlineChord) {
    tol = tol || 0.0002;
    const byLayer = {};
    items.forEach(it => {
      const L = byLayer[it.layer] || (byLayer[it.layer] = { segs: [], points: [], circles: [] });
      if (it.point) L.points.push(it.point);
      else if (it.circle) L.circles.push({ c: it.seg.c, r: it.seg.r });
      else if (it.seg && segLen(it.seg) > 1e-9) L.segs.push(it.seg);
    });
    const layers = {};
    Object.keys(byLayer).forEach(name => {
      const L = byLayer[name], segs = L.segs, used = new Array(segs.length).fill(false), contours = [];
      const near = (p, q) => Math.abs(p.x - q.x) <= tol && Math.abs(p.y - q.y) <= tol;
      const cell = Math.max(tol * 4, 1e-4), grid = new Map();
      const key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
      segs.forEach((s, k) => { [start(s), end(s)].forEach(p => { const kk = key(p.x, p.y); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(k); }); });
      const find = p => {
        const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const list = grid.get((cx + dx) + ',' + (cy + dy)); if (!list) continue;
          for (const k of list) if (!used[k]) { if (near(start(segs[k]), p)) return { k, rev: false }; if (near(end(segs[k]), p)) return { k, rev: true }; }
        }
        return null;
      };
      for (let k0 = 0; k0 < segs.length; k0++) {
        if (used[k0]) continue;
        used[k0] = true; const c = [segs[k0]];
        for (;;) { if (near(end(c[c.length - 1]), start(c[0])) && c.length > 1) break; const f = find(end(c[c.length - 1])); if (!f) break; used[f.k] = true; c.push(f.rev ? reverse(segs[f.k]) : segs[f.k]); }
        if (!near(end(c[c.length - 1]), start(c[0]))) {
          for (;;) { const f = find(start(c[0])); if (!f) break; used[f.k] = true; c.unshift(f.rev ? segs[f.k] : reverse(segs[f.k])); }
        }
        const full = c.length === 1 && c[0].t === 'A' && Math.abs(Math.abs(c[0].sw) - TAU) < 1e-9;
        contours.push(makeContour(c, full || (c.length > 1 && near(end(c[c.length - 1]), start(c[0]))), null, outlineChord));
      }
      L.circles.forEach(ci => contours.push(makeContour([{ t: 'A', c: ci.c, r: ci.r, a0: 0, sw: TAU }], true, ci, outlineChord)));
      layers[name] = { name, contours, points: L.points, circles: L.circles };
    });
    return layers;
  }
  // Douglas-Peucker on runs of straight segments: flattened curves become fewer, longer lines
  function simplify(segs, tol) {
    const out = []; let run = [];
    const flush = () => {
      if (!run.length) return;
      const pts = [run[0].a].concat(run.map(s => s.b));
      const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true;
      const stack = [[0, pts.length - 1]];
      while (stack.length) {
        const [i, j] = stack.pop(); let dm = -1, k = -1;
        const a = pts[i], b = pts[j], vx = b.x - a.x, vy = b.y - a.y, L = Math.hypot(vx, vy) || 1e-12;
        for (let m = i + 1; m < j; m++) { const d = L > 1e-9 ? Math.abs((pts[m].x - a.x) * vy - (pts[m].y - a.y) * vx) / L : Math.hypot(pts[m].x - a.x, pts[m].y - a.y); if (d > dm) { dm = d; k = m; } }
        if (dm > tol) { keep[k] = true; stack.push([i, k], [k, j]); }
      }
      let prev = pts[0];
      for (let m = 1; m < pts.length; m++) if (keep[m]) { out.push({ t: 'L', a: prev, b: pts[m] }); prev = pts[m]; }
      run = [];
    };
    segs.forEach(s => { if (s.t === 'L') run.push(s); else { flush(); out.push(s); } });
    flush();
    return out;
  }
  function makeContour(segs, closed, circle, outlineChord) {
    if (segs.length > 2) segs = simplify(segs, 0.0005);
    const pts = []; segs.forEach((s, i) => { const f = flatten(s, outlineChord || 0.005); (i ? f.slice(1) : f).forEach(p => pts.push(p)); });
    if (closed && pts.length > 1) pts.pop();
    let area = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a.x * b.y - b.x * a.y; }
    area /= 2;
    let len = 0; segs.forEach(s => { len += segLen(s); });
    return { segs, closed, area: closed ? area : 0, pts, bbox: bbox(pts), length: len, circle: circle || null };
  }
  function bbox(pts) {
    const b = { minx: Infinity, miny: Infinity, maxx: -Infinity, maxy: -Infinity };
    pts.forEach(p => { if (p.x < b.minx) b.minx = p.x; if (p.y < b.miny) b.miny = p.y; if (p.x > b.maxx) b.maxx = p.x; if (p.y > b.maxy) b.maxy = p.y; });
    return b;
  }
  function layersBBox(layers, names) {
    const pts = [];
    names.forEach(n => { const L = layers[n]; if (!L) return; L.contours.forEach(c => { pts.push(P(c.bbox.minx, c.bbox.miny), P(c.bbox.maxx, c.bbox.maxy)); }); L.points.forEach(p => pts.push(p)); });
    return pts.length ? bbox(pts) : null;
  }

  return { sniff, parseDXF, dwgToPairs, parseSTL, meshFromOcct, meshBBox, orientMesh, parseSVG, parseCSV, scaleItems, chain, flatten, reverse, start, end, segLen, arcPt, bbox, layersBBox, UNIT_NAMES, UNIT_TO_IN, DWG_VERSIONS };
})();

return CAD;
});
