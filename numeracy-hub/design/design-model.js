/* ACCESS shared design document. Geometry, stock and placement are ALWAYS mm.
 * units is a display preference only. Shared geometry/workflow helpers support browser and Node.
 * Placement is the lower-left corner of the geometry envelope in stock coordinates.
 * Exports are measured 2D design profiles, never machine programs or toolpaths.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AccessDesign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var FORMAT = 'access-design-project', VERSION = 1;
  var MAX_BYTES = 1048576, MIN_SIZE = 0.001, MAX_SIZE = 1000000;
  var FACTORS = Object.freeze({ mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8 });
  var FIELDS = ['format', 'version', 'id', 'title', 'brief', 'units', 'machine', 'geometry', 'stock', 'placement', 'reflection', 'workflow'];
  var geometryModule, workflowModule;
  function G() {
    if (root.AccessDesignGeometry) return root.AccessDesignGeometry;
    if (!geometryModule && typeof require === 'function') geometryModule = require('./design-geometry.js');
    if (!geometryModule) fail('The geometry library has not loaded. Reload the page to continue.');
    return geometryModule;
  }
  function W() {
    if (root.AccessDesignWorkflow) return root.AccessDesignWorkflow;
    if (!workflowModule && typeof require === 'function') workflowModule = require('./design-workflow.js');
    if (!workflowModule) fail('The workflow library has not loaded. Reload the page to continue.');
    return workflowModule;
  }

  function fail(message) { throw new Error(message); }
  function own(object, key) { return Object.prototype.hasOwnProperty.call(object, key); }
  function record(value, allowed, label, optional) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(label + ' must be an object.');
    var proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) fail(label + ' must contain plain JSON data.');
    var keys = Reflect.ownKeys(value);
    keys.forEach(function (key) {
      if (typeof key !== 'string' || allowed.indexOf(key) < 0) fail('Unexpected field in ' + label + ': ' + String(key));
      var descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !own(descriptor, 'value')) fail(label + ' must contain plain JSON data.');
    });
    allowed.forEach(function (key) { if (!(optional || []).includes(key) && !own(value, key)) fail('Missing ' + label + '.' + key); });
    return value;
  }
  function text(value, max, label, required) {
    if (typeof value !== 'string' || value.length > max) fail(label + ' must be text of at most ' + max + ' characters.');
    if (required && !value.trim()) fail(label + ' is required.');
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(label + ' contains unsupported control characters.');
    try { encodeURIComponent(value); } catch (_) { fail(label + ' contains invalid Unicode.'); }
    return value;
  }
  function size(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < MIN_SIZE || value > MAX_SIZE)
      fail(label + ' must be a number from ' + MIN_SIZE + ' to ' + MAX_SIZE + ' mm.');
    return value;
  }
  function coordinate(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > MAX_SIZE)
      fail(label + ' must be a finite coordinate within ±' + MAX_SIZE + ' mm.');
    return value === 0 ? 0 : value;
  }
  function unitFactor(units) {
    if (typeof units !== 'string' || !own(FACTORS, units)) fail('Choose a supported unit: mm, cm, m, in or ft.');
    return FACTORS[units];
  }
  function checkedGeometry(geometry) {
    return G().validate(geometry);
  }
  function geometryBounds(geometry) {
    return G().bounds(geometry);
  }
  function validate(raw) {
    record(raw, FIELDS, 'project', ['workflow']);
    if (raw.format !== FORMAT || raw.version !== VERSION) fail('Unsupported design project format or version.');
    if (raw.units !== 'mm' && raw.units !== 'in') fail('Project display units must be mm or in; stored measurements are always mm.');
    if (raw.machine !== 'mill' && raw.machine !== 'lathe') fail('Choose mill or lathe.');
    var geometry = checkedGeometry(raw.geometry);
    var envelope = geometryBounds(geometry);
    size(envelope.width, 'Geometry width'); size(envelope.height, 'Geometry height');
    record(raw.stock, ['width', 'height', 'depth', 'diameter', 'length'], 'stock');
    record(raw.placement, ['x', 'y'], 'placement');
    var stock = {};
    ['width', 'height', 'depth', 'diameter', 'length'].forEach(function (key) { stock[key] = size(raw.stock[key], 'Stock ' + key); });
    var result = {
      format: FORMAT, version: VERSION,
      id: text(raw.id, 100, 'Project ID', true),
      title: text(raw.title, 160, 'Title', true),
      brief: text(raw.brief, 4000, 'Design brief', false),
      units: raw.units, machine: raw.machine, geometry: geometry, stock: stock,
      placement: { x: coordinate(raw.placement.x, 'X placement'), y: coordinate(raw.placement.y, 'Y placement') },
      reflection: text(raw.reflection, 8000, 'Reflection', false)
    };
    if (raw.workflow !== undefined) result.workflow = W().validateMetadata(raw.workflow);
    return result;
  }
  function newId() {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      return globalThis.crypto.randomUUID();
    return 'design-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function make(geometry, title, units) {
    geometry = checkedGeometry(geometry);
    var b = geometryBounds(geometry), isLathe = geometry.shapeId === 'cylinder';
    var margin = 5, width = b.width + 2 * margin, height = b.height + 2 * margin;
    return validate({
      format: FORMAT, version: VERSION, id: newId(), title: title, brief: '',
      units: units, machine: isLathe ? 'lathe' : 'mill', geometry: geometry,
      // New turning jobs reserve 20 mm behind the target for the simulator's chuck jaws.
      stock: { width: width, height: height, depth: 10, diameter: b.diameter ? b.diameter + 2 * margin : Math.max(width, height), length: b.length ? b.length + 20 : width },
      placement: { x: margin, y: margin }, reflection: ''
    });
  }
  function create(template) {
    template = template === undefined ? 'plate' : template;
    if (template === 'plate') return make({ shapeId: 'rectangle', params: { l: 80, w: 50 } }, 'My plate design', 'mm');
    if (template === 'washer') return make({ shapeId: 'annulus', params: { R: 25, r: 10 } }, 'My washer design', 'mm');
    if (template === 'shaft') return make({ shapeId: 'cylinder', params: { r: 15, h: 80 } }, 'My shaft design', 'mm');
    var entry = G().list().find(function (s) { return s.id === template; });
    if (!entry) fail('Choose a supported shape template.');
    var params = {}; entry.params.forEach(function (p) { params[p.k] = p.def; });
    return make({ shapeId: entry.id, params: params }, 'My ' + entry.name.toLowerCase() + ' design', 'mm');
  }
  function fromCanvas(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Canvas design is required.');
    var geometry = { shapeId: input.shapeId, params: input.params };
    if (input.ao) geometry.ao = input.ao;
    if (input.rings) geometry.rings = input.rings;
    var converted = G().convert(geometry, input.units, 'mm');
    return make(converted, input.title === undefined ? 'My ' + input.shapeId + ' design' : input.title, input.units === 'in' || input.units === 'ft' ? 'in' : 'mm');
  }
  function fromProfile(input) {
    if (!input || !input.rings) fail('Closed drawing rings are required.');
    return fromCanvas({ shapeId: 'profile', params: {}, rings: input.rings, units: input.units || 'mm', title: input.title || 'My imported drawing' });
  }
  function toCanvas(project, units) {
    var p = validate(project);
    return G().convert(p.geometry, 'mm', units === undefined ? p.units : units);
  }
  function bounds(project) { return geometryBounds(validate(project).geometry); }
  function fits(p) {
    var b = geometryBounds(p.geometry), lathe = p.geometry.shapeId === 'cylinder';
    var w = lathe ? p.stock.length : p.stock.width, h = lathe ? p.stock.diameter : p.stock.height;
    var tolerance = 1e-8;
    // A lathe target is concentric with the stock, with its front at Z0.
    // Canvas X/Y placement belongs only to a flat milling profile.
    if (lathe) return b.length <= p.stock.length + tolerance && b.diameter <= p.stock.diameter + tolerance;
    return p.placement.x >= 0 && p.placement.y >= 0 && p.placement.x + b.width <= w + tolerance && p.placement.y + b.height <= h + tolerance;
  }
  function checks(project) {
    var p;
    try { p = validate(project); } catch (error) { return [{ id: 'dimensions', ok: false, message: error.message }]; }
    var isLathe = p.geometry.shapeId === 'cylinder', fit = fits(p), matched = isLathe ? p.machine === 'lathe' : p.machine === 'mill';
    return [
      { id: 'dimensions', ok: true, message: 'All design and stock dimensions are valid.' },
      { id: 'stock-fit', ok: fit, message: fit ? 'The design fits inside the stock at this placement.' : 'Move the design inside the stock or increase the stock dimensions.' },
      { id: 'machine', ok: matched, message: matched ? 'The shape matches the selected practice machine.' : (isLathe ? 'Choose lathe for a cylinder design.' : 'Choose mill for this flat profile.') },
      { id: 'brief', ok: !!p.brief.trim(), message: p.brief.trim() ? 'Your design brief is recorded.' : 'Describe what you are making and which measurements matter.' }
    ];
  }
  function encode(project) { return encodeURIComponent(JSON.stringify(validate(project))); }
  function decode(payload) {
    if (typeof payload !== 'string' || !payload.length || payload.length > MAX_BYTES * 3) fail('Design data is missing or exceeds the 1 MB limit.');
    var json;
    try { json = payload.trim().charAt(0) === '{' ? payload : decodeURIComponent(payload); }
    catch (_) { fail('The design link contains invalid encoding.'); }
    // URI encoding counts UTF-8 bytes without requiring a browser-only API.
    var byteCount;
    try { byteCount = encodeURIComponent(json).replace(/%[0-9A-F]{2}/g, 'x').length; }
    catch (_) { fail('Design data contains invalid Unicode.'); }
    if (byteCount > MAX_BYTES) fail('Design data exceeds the 1 MB limit.');
    var raw;
    try { raw = JSON.parse(json); } catch (_) { fail('This is not a valid JSON design project.'); }
    return validate(raw);
  }
  function profile(project) {
    var p = validate(project);
    if (p.geometry.shapeId === 'cylinder') fail('Cylinder export is not available: a lathe profile requires an explicit axis and machining plan. Save the project or use the cylinder in the Shapes Canvas.');
    if (p.machine !== 'mill') fail('Choose mill to export this 2D profile.');
    if (!fits(p)) fail('Fit the design inside the stock before exporting a 2D profile.');
    return p;
  }
  function n(number) { return Number(number.toFixed(6)).toString(); }
  function escapeXML(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
  function toSVG(project) {
    var p = profile(project), g = p.geometry, q = g.params, b = geometryBounds(g), x = p.placement.x, y = p.stock.height - p.placement.y - b.height;
    var drawing;
    if (g.shapeId === 'rectangle' || g.shapeId === 'square') {
      drawing = '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(b.width) + '" height="' + n(b.height) + '"/>';
    } else if (g.shapeId === 'circle' || g.shapeId === 'annulus') {
      var radius = g.shapeId === 'annulus' ? q.R : q.r, cx = x + radius, cy = y + radius;
      drawing = '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(radius) + '"/>';
      if (g.shapeId === 'annulus') drawing += '\n<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(q.r) + '"/>';
    } else {
      var out = G().outline(g);
      drawing = '<path fill-rule="evenodd" d="' + out.rings.map(function (r) { return 'M' + r.map(function (pnt) { return n(p.placement.x + pnt[0]) + ',' + n(p.stock.height - p.placement.y - pnt[1]); }).join('L') + 'Z'; }).join(' ') + '"/>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + n(p.stock.width) + 'mm" height="' + n(p.stock.height) + 'mm" viewBox="0 0 ' + n(p.stock.width) + ' ' + n(p.stock.height) + '">\n<title>' + escapeXML(p.title) + '</title>\n<desc>Measured 2D design profile in millimetres. Stock origin is lower left. This is not a toolpath or machine program.</desc>\n<g fill="none" stroke="#000000" stroke-width="0.1">\n' + drawing + '\n</g>\n</svg>\n';
  }
  function toDXF(project) {
    var p = profile(project), g = p.geometry, b = geometryBounds(g), x = p.placement.x, y = p.placement.y;
    var lines = ['999', 'ACCESS 2D design profile only; millimetres; lower-left stock origin; not a toolpath.', '0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1015', '9', '$INSUNITS', '70', '4', '9', '$MEASUREMENT', '70', '1', '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', '3'];
    ['0', 'PROFILE', 'HOLE'].forEach(function (layer) { lines.push('0', 'LAYER', '100', 'AcDbSymbolTableRecord', '100', 'AcDbLayerTableRecord', '2', layer, '70', '0', '62', '7', '6', 'CONTINUOUS'); });
    lines.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
    function line(x1, y1, x2, y2, layer) { lines.push('0', 'LINE', '100', 'AcDbEntity', '8', layer || 'PROFILE', '100', 'AcDbLine', '10', n(x1), '20', n(y1), '30', '0', '11', n(x2), '21', n(y2), '31', '0'); }
    function circle(radius, layer) { var outer = g.shapeId === 'annulus' ? g.params.R : g.params.r; lines.push('0', 'CIRCLE', '100', 'AcDbEntity', '8', layer, '100', 'AcDbCircle', '10', n(x + outer), '20', n(y + outer), '30', '0', '40', n(radius)); }
    if (g.shapeId === 'rectangle' || g.shapeId === 'square') {
      line(x, y, x + b.width, y); line(x + b.width, y, x + b.width, y + b.height);
      line(x + b.width, y + b.height, x, y + b.height); line(x, y + b.height, x, y);
    } else if (g.shapeId === 'circle' || g.shapeId === 'annulus') {
      circle(g.shapeId === 'annulus' ? g.params.R : g.params.r, 'PROFILE');
      if (g.shapeId === 'annulus') circle(g.params.r, 'HOLE');
    } else {
      var out = G().outline(g);
      out.rings.forEach(function (ring, ri) { ring.forEach(function (a, i) { var b = ring[(i + 1) % ring.length]; line(x + a[0], y + a[1], x + b[0], y + b[1], out.depths[ri] % 2 ? 'HOLE' : 'PROFILE'); }); });
    }
    lines.push('0', 'ENDSEC', '0', 'EOF');
    return lines.join('\r\n') + '\r\n';
  }
  return Object.freeze({
    format: FORMAT, version: VERSION, maxBytes: MAX_BYTES,
    create: create, validate: validate, fromCanvas: fromCanvas, fromProfile: fromProfile, toCanvas: toCanvas,
    encode: encode, decode: decode, bounds: bounds, checks: checks, toSVG: toSVG, toDXF: toDXF,
    geometryInfo: function (value) { return G().info(value); }, geometryParams: function (value) { return G().params(value); }, geometryCatalog: function () { return G().list(); },
    outline: function (project) { return G().outline(validate(project).geometry); },
    measurements: function (project, units) { var p = validate(project); return G().measurements(p.geometry, units || p.units); },
    render: function (project, units) { var p = validate(project); return G().render(p.geometry, units || p.units); }
  });
});
