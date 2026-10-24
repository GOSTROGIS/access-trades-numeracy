/* Shared measured geometry. Profiles are closed, even-odd rings in millimetres,
   X right / Y up. Engine curves remain parametric; polygon outlines are sampled. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AccessDesignGeometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var MAX = 1000000, MAX_POINTS = 4096, MAX_RINGS = 64, SAMPLE = 256;
  var CURVED = ['circle', 'semicircle', 'quarter-circle', 'sector', 'annulus', 'ellipse', 'stadium', 'reuleaux', 'ring-sector', 'lune'];
  var factors = { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 };
  var engineCache;
  var ringCache = new Map();
  function engine() {
    if (root.Shapes) return root.Shapes;
    if (!engineCache && typeof require === 'function') engineCache = require('../../source/canvas/src/vendor/shapes-engine.js');
    if (!engineCache) throw new Error('The shape engine has not loaded. Reload the page to continue.');
    return engineCache;
  }
  function fail(message) { throw new Error(message); }
  function plain(value, allowed, required, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(label + ' must contain plain JSON data.');
    Reflect.ownKeys(value).forEach(function (key) {
      var d = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || !allowed.includes(key) || !d.enumerable || !Object.prototype.hasOwnProperty.call(d, 'value')) fail('Unexpected field in ' + label + ': ' + String(key));
    });
    required.forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(value, key)) fail('Missing ' + label + '.' + key); });
  }
  function unit(units) { if (!Object.prototype.hasOwnProperty.call(factors, units)) fail('Choose a supported unit: mm, cm, m, in or ft.'); return factors[units]; }
  function geometry(value) { return value && value.geometry ? value.geometry : value; }
  function info(value) {
    var g = typeof value === 'string' ? { shapeId: value } : geometry(value), id = g && g.shapeId;
    if (id === 'profile') return { id: id, name: 'Closed drawing profile', kind: 'flat', params: [], hasProfile: true };
    var found = engine().list({ all: true }).find(function (s) { return s.id === id; });
    if (!found || (found.kind !== 'flat' && id !== 'cylinder')) fail('Choose a flat shape, a closed drawing profile, or a cylinder for turning.');
    var params = found.params;
    if (g.ao && g.ao.angleInput === 'angle') {
      params = engine().angleParams(id);
      if (!params) fail('This shape does not accept angle inputs.');
    }
    return { id: id, name: found.name, kind: found.kind, params: params, hasProfile: id !== 'cylinder' };
  }
  function area(ring) { var sum = 0; ring.forEach(function (p, i) { var q = ring[(i + 1) % ring.length]; sum += p[0] * q[1] - q[0] * p[1]; }); return sum / 2; }
  function inside(point, ring) { var result = false; ring.forEach(function (a, i) { var b = ring[(i + 1) % ring.length]; if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) result = !result; }); return result; }
  function extent(rings) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    rings.forEach(function (ring) { ring.forEach(function (p) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); }); });
    return { minX: minX, minY: minY, width: maxX - minX, height: maxY - minY };
  }
  function intersections(a, b, c, d, eps) {
    if (Math.max(a[0], b[0]) + eps < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) + eps < Math.min(a[0], b[0]) || Math.max(a[1], b[1]) + eps < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) + eps < Math.min(a[1], b[1])) return false;
    var cross = function (p, q, r) { var x = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); var tolerance = eps * Math.max(Math.hypot(q[0] - p[0], q[1] - p[1]), eps); return Math.abs(x) <= tolerance ? 0 : Math.sign(x); };
    var p = cross(a, b, c), q = cross(a, b, d), r = cross(c, d, a), s = cross(c, d, b);
    return p * q <= 0 && r * s <= 0;
  }
  function cleanRings(raw) {
    if (!Array.isArray(raw) || !raw.length || raw.length > MAX_RINGS) fail('A profile needs 1 to ' + MAX_RINGS + ' closed rings.');
    var count = 0;
    var rings = raw.map(function (ring) {
      if (!Array.isArray(ring) || ring.length < 3 || (count += ring.length) > MAX_POINTS) fail('A profile needs at least three points per ring and at most ' + MAX_POINTS + ' points in total.');
      var out = ring.map(function (p) {
        if (!Array.isArray(p) || p.length !== 2 || !p.every(function (n) { return typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= MAX; })) fail('Profile coordinates must be finite [X, Y] millimetre pairs within ±1,000,000 mm.');
        return [p[0] === 0 ? 0 : p[0], p[1] === 0 ? 0 : p[1]];
      });
      if (out.length > 3 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
      return out;
    });
    var cacheKey = JSON.stringify(rings);
    if (ringCache.has(cacheKey)) return JSON.parse(ringCache.get(cacheKey));
    var box = extent(rings), eps = Math.max(box.width, box.height, 1) * 1e-10;
    if (box.width < 0.001 || box.height < 0.001 || box.width > MAX || box.height > MAX) fail('Profile width and height must be from 0.001 to 1,000,000 mm.');
    rings = rings.map(function (r) { return r.map(function (p) { return [p[0] - box.minX, p[1] - box.minY]; }); });
    var edges = [];
    rings.forEach(function (r, ri) {
      if (Math.abs(area(r)) < eps * eps) fail('A profile ring has zero area.');
      r.forEach(function (p, i) { var q = r[(i + 1) % r.length]; if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= eps) fail('A profile has a repeated point or a zero-length edge.'); edges.push({ a: p, b: q, ring: ri, i: i, n: r.length }); });
    });
    for (var i = 0; i < edges.length; i++) for (var j = i + 1; j < edges.length; j++) {
      var a = edges[i], b = edges[j];
      if (a.ring === b.ring && (Math.abs(a.i - b.i) === 1 || Math.abs(a.i - b.i) === a.n - 1)) continue;
      if (intersections(a.a, a.b, b.a, b.b, eps)) fail('Profile rings must not cross, overlap or touch themselves or each other.');
    }
    var depths = rings.map(function (r, i) { return rings.reduce(function (n, other, j) { return n + (i !== j && inside(r[0], other) ? 1 : 0); }, 0); });
    rings = rings.map(function (r, i) {
      var out = r.map(function (p) { return p.slice(); });
      if ((area(out) > 0) !== (depths[i] % 2 === 0)) out.reverse();
      return out;
    });
    var result = { rings: rings, width: box.width, height: box.height, depths: depths };
    if (ringCache.size >= 16) ringCache.delete(ringCache.keys().next().value);
    ringCache.set(cacheKey, JSON.stringify(result));
    return result;
  }
  function validate(raw) {
    raw = geometry(raw);
    if (!raw || typeof raw.shapeId !== 'string') fail('A geometry shapeId is required.');
    if (raw.shapeId === 'profile') {
      plain(raw, ['shapeId', 'params', 'rings'], ['shapeId', 'params', 'rings'], 'geometry');
      plain(raw.params, [], [], 'geometry.params');
      return { shapeId: 'profile', params: {}, rings: cleanRings(raw.rings).rings };
    }
    plain(raw, ['shapeId', 'params', 'ao'], ['shapeId', 'params'], 'geometry');
    var ao;
    if (raw.ao !== undefined) {
      plain(raw.ao, ['angles', 'angleInput'], ['angles', 'angleInput'], 'geometry.ao');
      if (typeof raw.ao.angles !== 'boolean' || !['sides', 'angle'].includes(raw.ao.angleInput)) fail('Use sides or angle triangle inputs.');
      ao = { angles: raw.ao.angles, angleInput: raw.ao.angleInput };
    }
    var inf = info(raw), params = {};
    plain(raw.params, inf.params.map(function (p) { return p.k; }), inf.params.map(function (p) { return p.k; }), 'geometry.params');
    inf.params.forEach(function (p) {
      var n = raw.params[p.k];
      if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > MAX || (!p.angle && !p.int && n < 0.001) || (p.int && !Number.isInteger(n))) fail(p.name + ' must be a valid positive ' + (p.int ? 'whole number.' : p.angle ? 'angle in degrees.' : 'length in millimetres.'));
      params[p.k] = n;
    });
    var error = engine().validate(raw.shapeId, params, ao);
    if (error) fail(error.msg);
    var result = { shapeId: raw.shapeId, params: params };
    if (ao) result.ao = ao;
    if (raw.shapeId !== 'cylinder') outline(result);
    return result;
  }
  function outline(value) {
    var g = geometry(value);
    if (g.shapeId === 'cylinder') fail('A cylinder is a turning solid, not a closed milling profile.');
    if (g.shapeId === 'profile') { var profile = cleanRings(g.rings); profile.approximate = false; profile.tolerance = 0; return profile; }
    info(g);
    var rings = engine()._rings(g.shapeId, g.params, SAMPLE, g.ao).map(function (r) { return r.map(function (p) { return [p[0], -p[1]]; }); });
    // Engine rings can include a duplicate closing vertex from a sampled full arc.
    rings.forEach(function (r) { if (r.length > 3 && Math.hypot(r[0][0] - r[r.length - 1][0], r[0][1] - r[r.length - 1][1]) < 1e-9) r.pop(); });
    var result = cleanRings(rings);
    result.approximate = CURVED.includes(g.shapeId);
    // Arc sampling advances at most 2π/SAMPLE. The largest length parameter bounds
    // every generating radius (also the ellipse's largest semi-axis), even for a thin arc.
    var radiusBound = Math.max.apply(null, info(g).params.filter(function (p) { return !p.angle && !p.int; }).map(function (p) { return g.params[p.k]; }));
    result.tolerance = result.approximate ? radiusBound * (1 - Math.cos(Math.PI / SAMPLE)) : 0;
    return result;
  }
  function bounds(value) {
    var g = geometry(value), p = g.params;
    if (g.shapeId === 'cylinder') return { width: p.h, height: 2 * p.r, length: p.h, diameter: 2 * p.r };
    var out = outline(g), result = { width: out.width, height: out.height };
    if (g.shapeId === 'circle' || g.shapeId === 'annulus') result.diameter = out.width;
    return result;
  }
  function convert(value, from, to) {
    var g = geometry(value), factor = unit(from) / unit(to), inf = info(g), params = {};
    if (g.shapeId === 'profile') {
      if (!Array.isArray(g.rings)) fail('Closed profile rings are required.');
      return { shapeId: 'profile', params: {}, rings: g.rings.map(function (r) { if (!Array.isArray(r)) fail('Each ring must be an array.'); return r.map(function (p) { if (!Array.isArray(p) || p.length !== 2 || !p.every(function (v) { return typeof v === 'number' && Number.isFinite(v); })) fail('Profile points must be numeric [X, Y] pairs.'); return [p[0] * factor, p[1] * factor]; }); }) };
    }
    plain(g.params, inf.params.map(function (p) { return p.k; }), inf.params.map(function (p) { return p.k; }), 'Canvas parameters');
    inf.params.forEach(function (p) { if (typeof g.params[p.k] !== 'number' || !Number.isFinite(g.params[p.k])) fail('Canvas ' + p.name + ' must be a finite number.'); params[p.k] = g.params[p.k] * (p.angle || p.int ? 1 : factor); });
    var result = { shapeId: g.shapeId, params: params }; if (g.ao) result.ao = Object.assign({}, g.ao); return result;
  }
  function measurements(value, units) {
    var g = geometry(value), u = units || 'mm', scaled = convert(g, 'mm', u);
    if (g.shapeId !== 'profile') return engine().calc(g.shapeId, scaled.params, u, g.ao);
    var out = outline(g), A = 0, P = 0;
    out.rings.forEach(function (r) { A += area(r); r.forEach(function (p, i) { var q = r[(i + 1) % r.length]; P += Math.hypot(p[0] - q[0], p[1] - q[1]); }); });
    A /= unit(u) * unit(u); P /= unit(u);
    return { items: [{ name: 'Profile area (holes removed)', key: 'A', sym: 'A', value: A, unit: u + '²', lines: ['Area = sum of outer ring areas − hole areas (shoelace formula).'] }, { name: 'Total boundary length', key: 'P', sym: 'P', value: P, unit: u, lines: ['Boundary length = sum of all outer and hole edges.'] }], notes: ['Profile measurements use the stored polygon edges.'] };
  }
  function n(value) { return Number(value.toFixed(9)).toString(); }
  function render(value, units) {
    var g = geometry(value), u = units || 'mm', scaled = convert(g, 'mm', u);
    if (g.shapeId !== 'profile') return engine().render(g.shapeId, scaled.params, { units: u, labels: 'values', angles: !!(g.ao && g.ao.angles), angleInput: g.ao && g.ao.angleInput });
    var out = outline(g), padding = Math.max(out.width, out.height) * 0.08, d = out.rings.map(function (r) { return 'M' + r.map(function (p) { return n(p[0]) + ',' + n(out.height - p[1]); }).join('L') + 'Z'; }).join(' ');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [-padding, -padding, out.width + 2 * padding, out.height + 2 * padding].map(n).join(' ') + '"><path d="' + d + '" fill="#FFEBB2" fill-rule="evenodd" stroke="#940010" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }
  return Object.freeze({ validate: validate, info: info, params: function (value) { return info(value).params; }, outline: outline, bounds: bounds, convert: convert, measurements: measurements, render: render, cleanRings: cleanRings,
    list: function () { return engine().list({ all: true }).filter(function (s) { return s.kind === 'flat' || s.id === 'cylinder'; }); }, maxPoints: MAX_POINTS });
});
