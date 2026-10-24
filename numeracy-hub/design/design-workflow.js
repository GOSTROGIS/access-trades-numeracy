/* Offline student workflow: project library, revision evidence, assignments and inspection.
 * One library is persisted in one storage record. All helpers return detached data.
 * Inspection and recorded simulator evidence are learning records, not machine certification.
 * Metadata validation has no model dependency; the project model is resolved lazily.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AccessDesignWorkflow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  var KEY = 'access-design-library-v1', MAX_PROJECTS = 20, MAX_REVISIONS = 12, MAX_BYTES = 4 * 1024 * 1024;
  var META_KEYS = ['version', 'revision', 'mode', 'checkpoints', 'inspections', 'assignment', 'reviews', 'operation', 'results', 'sequence', 'comparison'];
  var OP_KEYS = ['kind', 'toolDiameterMm', 'depthMm', 'stepDownMm', 'feedMmPerMin', 'spindleRpm'];
  var RESULT_KEYS = ['id', 'kind', 'capturedAt', 'sourceFingerprint', 'operationKind', 'programNumber', 'programLineCount', 'actionCount', 'accepted', 'removedVolumeMm3', 'diagnostics', 'summary', 'operationCount', 'comparison'];
  var INSPECTION_KEYS = ['id', 'key', 'label', 'nominalMm', 'measuredMm', 'toleranceMinusMm', 'tolerancePlusMm', 'resolutionMm', 'instrument', 'notes', 'sourceFingerprint', 'recordedAt'];
  function fail(message) { throw Error(message); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function record(o, keys, label, optional) {
    if (!o || typeof o !== 'object' || Array.isArray(o) || ![Object.prototype, null].includes(Object.getPrototypeOf(o))) fail(label + ' must be a plain object.');
    Reflect.ownKeys(o).forEach(function (k) {
      var d = Object.getOwnPropertyDescriptor(o, k);
      if (typeof k !== 'string' || !keys.includes(k) || !d.enumerable || !own(d, 'value')) fail('Unexpected field in ' + label + ': ' + String(k));
    });
    keys.forEach(function (k) { if (!own(o, k) && !(optional || []).includes(k)) fail('Missing ' + label + '.' + k); });
    return o;
  }
  function str(v, max, label, required) {
    if (typeof v !== 'string' || v.length > max || (required && !v.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) fail('Invalid ' + label + '.');
    try { encodeURIComponent(v); } catch (_) { fail('Invalid Unicode in ' + label + '.'); }
    return v;
  }
  function number(v, min, max, label, integer) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail('Invalid ' + label + '.');
    return v;
  }
  function nullableNumber(v, min, max, label) { return v === null ? null : number(v, min, max, label); }
  function choice(v, options, label) { if (!options.includes(v)) fail('Invalid ' + label + '.'); return v; }
  function list(v, max, fn, label) {
    if (!Array.isArray(v) || v.length > max) fail(label + ' must contain at most ' + max + ' entries.');
    var result = v.map(fn), ids = result.filter(function (x) { return x && typeof x === 'object' && own(x, 'id'); }).map(function (x) { return x.id; });
    if (new Set(ids).size !== ids.length) fail('Duplicate IDs in ' + label + '.');
    return result;
  }
  function date(v, label) { str(v, 32, label, true); if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 19) !== v.slice(0, 19)) fail('Invalid ' + label + '.'); return v; }
  function now() { return new Date().toISOString(); }
  function id(prefix) { return prefix + '-' + (root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function D() { var model = typeof module === 'object' && module.exports ? require('./design-model.js') : root.AccessDesign; if (!model || !model.validate) fail('The design model is unavailable.'); return model; }
  function project(raw) { return D().validate(raw); }
  function defaults() { return { version: 1, revision: 1, mode: 'guided', checkpoints: [], inspections: [], assignment: null, reviews: [], operation: null, results: [] }; }
  function validateOperation(o) {
    if (o === null) return null;
    record(o, OP_KEYS, 'operation');
    var result = { kind: choice(o.kind, ['profile-out', 'profile-in', 'pocket', 'drill', 'turn', 'clear-outside'], 'operation kind') };
    ['toolDiameterMm', 'depthMm', 'stepDownMm', 'feedMmPerMin'].forEach(function (k) { result[k] = number(o[k], 0.000001, 1000000, k); });
    result.spindleRpm = number(o.spindleRpm, 1, 100000, 'spindle RPM', true);
    if (result.stepDownMm > result.depthMm) fail('Step down must not exceed the total depth.');
    return result;
  }
  function validateSequence(s) {
    record(s, ['version', 'steps'], 'sequence');
    if (s.version !== 1) fail('Unsupported machining sequence version.');
    return { version: 1, steps: list(s.steps, 12, function (step) {
      record(step, ['id', 'label', 'operation'], 'sequence step');
      var operation = validateOperation(step.operation);
      if (!operation) fail('Each sequence step needs an operation.');
      return { id: str(step.id, 100, 'sequence step ID', true), label: str(step.label, 160, 'sequence step label', true), operation: operation };
    }, 'sequence steps') };
  }
  function validateComparison(c) {
    record(c, ['mode', 'depthMm', 'toleranceMm'], 'comparison settings');
    return { mode: choice(c.mode, ['retained-solid', 'pocket'], 'comparison target mode'), depthMm: nullableNumber(c.depthMm, 0.000001, 1000000, 'comparison depth'), toleranceMm: number(c.toleranceMm, 0, 1000000, 'comparison tolerance') };
  }
  function validateComparisonResult(c) {
    record(c, ['version', 'machine', 'mode', 'depthMm', 'toleranceMm', 'resolutionMm', 'status', 'metrics', 'observations', 'limitations', 'overlay'], 'comparison result');
    if (c.version !== 1) fail('Unsupported comparison result version.');
    var settings = validateComparison({ mode: c.mode, depthMm: c.depthMm, toleranceMm: c.toleranceMm });
    var status = choice(c.status, ['within-sample-tolerance', 'needs-work', 'resolution-limited', 'unsupported', 'incomplete'], 'comparison status');
    var machine = choice(c.machine, ['mill', 'lathe'], 'comparison machine');
    if (machine === 'lathe' && (settings.mode !== 'retained-solid' || settings.depthMm !== null)) fail('Lathe comparison needs the retained-solid target and no milling depth.');
    if (machine === 'mill' && settings.depthMm === null) fail('Mill comparison needs an explicit target depth.');
    var metricKeys = ['sampleCount', 'desiredVolumeMm3', 'actualVolumeMm3', 'missingVolumeMm3', 'excessVolumeMm3', 'maxUndercutMm', 'maxExcessMm', 'mismatchedPercent'];
    record(c.metrics, metricKeys, 'comparison metrics');
    var metrics = { sampleCount: number(c.metrics.sampleCount, 0, 10000000, 'comparison samples', true) };
    ['desiredVolumeMm3', 'actualVolumeMm3', 'missingVolumeMm3', 'excessVolumeMm3'].forEach(function (key) { metrics[key] = number(c.metrics[key], 0, 1e18, key); });
    ['maxUndercutMm', 'maxExcessMm'].forEach(function (key) { metrics[key] = number(c.metrics[key], 0, 1000000, key); });
    metrics.mismatchedPercent = number(c.metrics.mismatchedPercent, 0, 100, 'mismatched sample percentage');
    var overlay = null;
    if (c.overlay !== null) {
      if (c.overlay && c.overlay.kind === 'mill-map') {
        record(c.overlay, ['kind', 'columns', 'rows', 'widthMm', 'heightMm', 'cells'], 'comparison map');
        var columns = number(c.overlay.columns, 1, 48, 'map columns', true), rows = number(c.overlay.rows, 1, 48, 'map rows', true);
        var cells = str(c.overlay.cells, 2304, 'map cells', true);
        if (machine !== 'mill' || cells.length !== columns * rows || /[^0-3]/.test(cells)) fail('Comparison map cells do not match its dimensions or machine.');
        overlay = { kind: 'mill-map', columns: columns, rows: rows, widthMm: number(c.overlay.widthMm, 0.000001, 1000000, 'map width'), heightMm: number(c.overlay.heightMm, 0.000001, 1000000, 'map height'), cells: cells };
      } else if (c.overlay && c.overlay.kind === 'lathe-chart') {
        record(c.overlay, ['kind', 'lengthMm', 'targetDiameterMm', 'samples'], 'comparison chart');
        if (machine !== 'lathe') fail('A lathe chart cannot describe a mill comparison.');
        var length = number(c.overlay.lengthMm, 0.000001, 1000000, 'chart length'), lastZ = -1;
        var samples = list(c.overlay.samples, 192, function (sample) {
          record(sample, ['zMm', 'diameterMm'], 'chart sample');
          var z = number(sample.zMm, 0, length, 'sample position');
          if (z < lastZ) fail('Lathe chart samples must be ordered along the part.'); lastZ = z;
          return { zMm: z, diameterMm: number(sample.diameterMm, 0, 1000000, 'sample diameter') };
        }, 'chart samples');
        overlay = { kind: 'lathe-chart', lengthMm: length, targetDiameterMm: number(c.overlay.targetDiameterMm, 0.000001, 1000000, 'target diameter'), samples: samples };
      } else fail('Unsupported comparison overlay.');
    }
    return { version: 1, machine: machine, mode: settings.mode, depthMm: settings.depthMm, toleranceMm: settings.toleranceMm,
      resolutionMm: number(c.resolutionMm, ['unsupported', 'incomplete'].includes(status) ? 0 : 0.000001, 1000000, 'comparison resolution'), status: status, metrics: metrics,
      observations: list(c.observations, 8, function (v) { return str(v, 600, 'comparison observation', true); }, 'comparison observations'),
      limitations: list(c.limitations, 8, function (v) { return str(v, 600, 'comparison limitation', true); }, 'comparison limitations'), overlay: overlay };
  }
  function validateCheckpoint(c) {
    record(c, ['id', 'label', 'unit', 'estimate', 'actual', 'tolerance', 'working', 'sourceFingerprint'], 'checkpoint');
    return { id: str(c.id, 100, 'checkpoint ID', true), label: str(c.label, 160, 'checkpoint label', true), unit: choice(c.unit, ['mm', 'mm2', 'mm3', 'count'], 'checkpoint unit'),
      estimate: nullableNumber(c.estimate, 0, 1e18, 'estimate'), actual: nullableNumber(c.actual, 0, 1e18, 'actual value'), tolerance: nullableNumber(c.tolerance, 0, 1e18, 'tolerance'),
      working: str(c.working, 4000, 'working'), sourceFingerprint: str(c.sourceFingerprint, 100, 'checkpoint fingerprint', true) };
  }
  function validateInspection(i) {
    record(i, INSPECTION_KEYS, 'inspection');
    return { id: str(i.id, 100, 'inspection ID', true), key: str(i.key, 80, 'dimension key', true), label: str(i.label, 160, 'inspection label', true),
      nominalMm: number(i.nominalMm, 0, 1000000, 'nominal size'), measuredMm: nullableNumber(i.measuredMm, 0, 1000000, 'measured size'),
      toleranceMinusMm: number(i.toleranceMinusMm, 0, 1000000, 'lower tolerance'), tolerancePlusMm: number(i.tolerancePlusMm, 0, 1000000, 'upper tolerance'),
      resolutionMm: nullableNumber(i.resolutionMm, 0.000001, 1000000, 'instrument resolution'), instrument: str(i.instrument, 160, 'instrument'), notes: str(i.notes, 4000, 'inspection notes'),
      sourceFingerprint: str(i.sourceFingerprint, 100, 'inspection fingerprint', true), recordedAt: date(i.recordedAt, 'inspection date') };
  }
  function validateResult(r) {
    record(r, RESULT_KEYS, 'result', ['operationCount', 'comparison']);
    if (typeof r.accepted !== 'boolean') fail('Result accepted must be true or false.');
    var result = { id: str(r.id, 100, 'result ID', true), kind: choice(r.kind, ['simulation', 'check', 'inspection'], 'result kind'), capturedAt: date(r.capturedAt, 'result date'),
      sourceFingerprint: str(r.sourceFingerprint, 100, 'result fingerprint', true), operationKind: choice(r.operationKind, ['', 'profile-out', 'profile-in', 'pocket', 'drill', 'turn', 'clear-outside', 'sequence'], 'result operation'),
      programNumber: number(r.programNumber, 0, 99999, 'program number', true), programLineCount: number(r.programLineCount, 0, 1000000, 'program lines', true),
      actionCount: number(r.actionCount, 0, 1000000, 'action count', true), accepted: r.accepted, removedVolumeMm3: number(r.removedVolumeMm3, 0, 1e18, 'removed volume'),
      diagnostics: list(r.diagnostics, 100, function (d) { record(d, ['level', 'message'], 'diagnostic'); return { level: choice(d.level, ['info', 'warning', 'error'], 'diagnostic level'), message: str(d.message, 1000, 'diagnostic message', true) }; }, 'diagnostics'),
      summary: str(r.summary, 4000, 'result summary') };
    if (own(r, 'operationCount')) result.operationCount = number(r.operationCount, 0, 12, 'captured operation count', true);
    if (own(r, 'comparison')) result.comparison = validateComparisonResult(r.comparison);
    return result;
  }
  function validateAssignment(a) {
    record(a, ['format', 'version', 'id', 'title', 'brief', 'starter', 'criteria', 'requirements', 'reflectionPrompts', 'teacherNotes'], 'assignment');
    if (a.format !== 'access-design-assignment' || a.version !== 1) fail('Unsupported assignment format or version.');
    var out = { format: a.format, version: 1, id: str(a.id, 100, 'assignment ID', true), title: str(a.title, 160, 'assignment title', true), brief: str(a.brief, 4000, 'assignment brief'),
      starter: choice(a.starter, ['plate', 'washer', 'shaft', 'any'], 'assignment starter'),
      criteria: list(a.criteria, 20, function (c) { record(c, ['id', 'title', 'description', 'maxScore'], 'criterion'); return { id: str(c.id, 100, 'criterion ID', true), title: str(c.title, 160, 'criterion title', true), description: str(c.description, 1000, 'criterion description'), maxScore: number(c.maxScore, 1, 100, 'criterion maximum', true) }; }, 'criteria'),
      requirements: list(a.requirements, 30, function (r) { record(r, ['key', 'targetMm', 'toleranceMm'], 'requirement'); return { key: str(r.key, 80, 'requirement dimension', true), targetMm: number(r.targetMm, 0, 1000000, 'requirement target'), toleranceMm: number(r.toleranceMm, 0, 1000000, 'requirement tolerance') }; }, 'requirements'),
      reflectionPrompts: list(a.reflectionPrompts, 10, function (p) { return str(p, 500, 'reflection prompt', true); }, 'reflection prompts'), teacherNotes: str(a.teacherNotes, 4000, 'teacher notes') };
    if (!out.criteria.length) fail('An assignment needs at least one rubric criterion.');
    if (new Set(out.requirements.map(function (r) { return r.key; })).size !== out.requirements.length) fail('Duplicate assignment dimension requirements.');
    return out;
  }
  function validateMetadata(m) {
    record(m, META_KEYS, 'workflow', ['sequence', 'comparison']);
    if (m.version !== 1) fail('Unsupported workflow version.');
    var assignment = m.assignment === null ? null : validateAssignment(m.assignment);
    var reviews = list(m.reviews, 20, function (r) {
      record(r, ['criterionId', 'score', 'comment', 'reviewer'], 'review');
      var criterion = assignment && assignment.criteria.find(function (c) { return c.id === r.criterionId; });
      if (!criterion) fail('Review must refer to a criterion in the assignment.');
      return { criterionId: criterion.id, score: nullableNumber(r.score, 0, criterion.maxScore, 'criterion score'), comment: str(r.comment, 2000, 'review comment'), reviewer: str(r.reviewer, 160, 'reviewer') };
    }, 'reviews');
    if (new Set(reviews.map(function (r) { return r.criterionId; })).size !== reviews.length) fail('Duplicate criterion reviews.');
    var clean = { version: 1, revision: number(m.revision, 1, 1000000000, 'revision', true), mode: choice(m.mode, ['guided', 'advanced'], 'workflow mode'),
      checkpoints: list(m.checkpoints, 30, validateCheckpoint, 'checkpoints'), inspections: list(m.inspections, 50, validateInspection, 'inspections'), assignment: assignment,
      reviews: reviews, operation: validateOperation(m.operation), results: list(m.results, 20, validateResult, 'results') };
    if (own(m, 'sequence')) clean.sequence = validateSequence(m.sequence);
    if (own(m, 'comparison')) clean.comparison = validateComparison(m.comparison);
    if (bytes(JSON.stringify(clean)) > 256 * 1024) fail('Learning records exceed 256 KB. Export the submission and remove older records before adding more.');
    return clean;
  }
  function metadata(p) { return p.workflow ? validateMetadata(p.workflow) : defaults(); }
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ':' + stable(value[k]); }).join(',') + '}';
    return JSON.stringify(value);
  }
  function hash(value, prefix) { var s = stable(value), h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (prefix || 'design-v1-') + (h >>> 0).toString(16).padStart(8, '0'); }
  function fingerprint(raw) {
    var p = project(raw), m = metadata(p), value = { id: p.id, geometry: p.geometry, stock: p.stock, placement: p.placement, units: p.units, machine: p.machine, operation: m.operation };
    // Preserve exact old fingerprints until a project opts into the new contract.
    if (own(m, 'sequence')) value.sequence = m.sequence;
    if (own(m, 'comparison')) value.comparison = m.comparison;
    if (own(m, 'sequence') || own(m, 'comparison')) return hash(value, 'design-v2-');
    return hash(value);
  }
  function geometryFingerprint(raw) { var p = project(raw); return hash({ id: p.id, geometry: p.geometry }); }
  function withMetadata(raw) { var p = project(raw); p.workflow = metadata(p); return p; }
  function syncMetadata(raw, previous) {
    var p = withMetadata(raw), old = previous ? withMetadata(previous) : null;
    if (old && old.id === p.id) {
      var a = clone(p), b = clone(old); a.workflow.revision = b.workflow.revision = 1;
      p.workflow.revision = stable(a) === stable(b) ? old.workflow.revision : old.workflow.revision + 1;
    }
    return project(p);
  }
  function resultStatus(raw, result) {
    var r = validateResult(result), stale = r.sourceFingerprint !== fingerprint(raw);
    // Older files can omit explicit goal settings. Compare the captured goal as well
    // so a changed default cannot make old comparison evidence look current.
    if (r.comparison) {
      var p = project(raw), expected = getComparison(p), c = r.comparison;
      if (c.machine !== p.machine || c.mode !== expected.mode || c.depthMm !== expected.depthMm || c.toleranceMm !== expected.toleranceMm) stale = true;
    }
    return { stale: stale, status: stale ? 'stale' : 'current' };
  }
  function setOperation(raw, operation) { var p = withMetadata(raw); p.workflow.operation = validateOperation(operation); delete p.workflow.sequence; return syncMetadata(p, raw); }
  function getSequence(raw) {
    var p = withMetadata(raw), m = p.workflow;
    return own(m, 'sequence') ? clone(m.sequence) : { version: 1, steps: m.operation ? [{ id: 'legacy-operation', label: m.operation.kind.replace(/-/g, ' '), operation: clone(m.operation) }] : [] };
  }
  function setSequence(raw, input) {
    var p = withMetadata(raw), sequence = validateSequence(input);
    p.workflow.sequence = sequence;
    // The list is authoritative; this mirror only supports older summary readers.
    p.workflow.operation = sequence.steps.length ? clone(sequence.steps[0].operation) : null;
    return syncMetadata(p, raw);
  }
  function comparisonState(raw) {
    var p = withMetadata(raw), present = own(p.workflow, 'comparison');
    var settings = present ? clone(p.workflow.comparison) : { mode: p.machine === 'mill' ? 'pocket' : 'retained-solid', depthMm: p.machine === 'mill' ? Math.min(2, p.stock.depth * .2) : null, toleranceMm: 0.1 };
    var adjusted = false;
    // Editing the stock or switching machines must remain possible with old evidence.
    // Resolve a safe current target without rewriting the historic explicit settings.
    if (p.machine === 'lathe' && (settings.mode !== 'retained-solid' || settings.depthMm !== null)) { settings.mode = 'retained-solid'; settings.depthMm = null; adjusted = true; }
    if (p.machine === 'mill' && (settings.depthMm === null || settings.depthMm > p.stock.depth)) { settings.depthMm = p.stock.depth; adjusted = true; }
    return { settings: settings, adjusted: adjusted, message: adjusted ? 'The machine or stock changed. Review and save the comparison target shown for this setup.' : '' };
  }
  function getComparison(raw) { return comparisonState(raw).settings; }
  function setComparison(raw, input) {
    var p = withMetadata(raw), comparison = validateComparison(input);
    if (p.machine === 'lathe' && (comparison.mode !== 'retained-solid' || comparison.depthMm !== null)) fail('A cylinder comparison uses its retained diameter and length, with no milling depth.');
    if (p.machine === 'mill' && (comparison.depthMm === null || comparison.depthMm > p.stock.depth)) fail('Choose a comparison depth greater than zero and no larger than the stock depth.');
    p.workflow.comparison = comparison;
    return syncMetadata(p, raw);
  }
  function recordResult(raw, input) {
    var p = withMetadata(raw), src = input || {};
    var data = { id: src.id || id('result'), kind: src.kind || 'simulation', capturedAt: src.capturedAt || now(), sourceFingerprint: fingerprint(p),
      operationKind: src.operationKind || '', programNumber: src.programNumber === undefined ? 0 : src.programNumber, programLineCount: src.programLineCount === undefined ? 0 : src.programLineCount,
      actionCount: src.actionCount === undefined ? 0 : src.actionCount, accepted: src.accepted === true, removedVolumeMm3: src.removedVolumeMm3 === undefined ? 0 : src.removedVolumeMm3,
      diagnostics: src.diagnostics || [], summary: src.summary || '' };
    if (src.operationCount !== undefined) data.operationCount = src.operationCount;
    if (src.comparison !== undefined) {
      var comparison = validateComparisonResult(src.comparison), expected = getComparison(p);
      if (comparison.machine !== p.machine || comparison.mode !== expected.mode || comparison.depthMm !== expected.depthMm || comparison.toleranceMm !== expected.toleranceMm) fail('Comparison evidence must match the current target settings and machine.');
      data.comparison = comparison;
    }
    var r = validateResult(data);
    p.workflow.results = p.workflow.results.filter(function (v) { return v.id !== r.id; }).concat([r]).slice(-20);
    return syncMetadata(p, raw);
  }
  function addCheckpoint(raw, input) {
    var p = withMetadata(raw), c = validateCheckpoint({ id: input.id || id('checkpoint'), label: input.label, unit: input.unit || 'mm',
      estimate: input.estimate === undefined ? null : input.estimate, actual: input.actual === undefined ? null : input.actual,
      tolerance: input.tolerance === undefined ? null : input.tolerance, working: input.working || '', sourceFingerprint: geometryFingerprint(p) });
    p.workflow.checkpoints = p.workflow.checkpoints.filter(function (v) { return v.id !== c.id; }).concat([c]).slice(-30);
    return syncMetadata(p, raw);
  }
  function checkpointStatus(raw, input) {
    var c = validateCheckpoint(input), stale = c.sourceFingerprint !== geometryFingerprint(raw), delta = c.estimate === null || c.actual === null ? null : c.actual - c.estimate;
    return { stale: stale, status: stale ? 'stale' : delta === null ? 'pending' : c.tolerance === null ? 'recorded' : Math.abs(delta) <= c.tolerance + 1e-10 ? 'within-tolerance' : 'outside-tolerance', difference: delta };
  }
  function dimension(raw, key) {
    var p = project(raw);
    if (typeof key !== 'string') fail('Choose a dimension.');
    var engine = typeof module === 'object' && module.exports ? require('../../source/canvas/src/vendor/shapes-engine.js') : root.Shapes;
    var info = engine && engine.info ? engine.info(p.geometry.shapeId) : null;
    var params = p.geometry.ao && p.geometry.ao.angleInput === 'angle' && engine && engine.angleParams ? engine.angleParams(p.geometry.shapeId) : info && info.params;
    var parameter = params && params.find(function (q) { return q.k === key; });
    if (parameter && (parameter.angle || parameter.int)) fail('Choose a length for inspection, not an angle or a count.');
    if (/^(angle|theta|count|segments|sides|n)$/i.test(key)) fail('Choose a length for inspection, not an angle or a count.');
    if (own(p.geometry.params, key)) return number(p.geometry.params[key], 0, 1000000, 'dimension');
    var b = D().bounds(p);
    if (['width', 'height', 'diameter', 'length'].includes(key) && own(b, key)) return number(b[key], 0, 1000000, 'dimension');
    fail('That dimension is not available on this design.');
  }
  function inspect(raw, input) {
    var p = withMetadata(raw), factor = input.units === undefined || input.units === 'mm' ? 1 : input.units === 'in' ? 25.4 : fail('Inspection units must be mm or in.');
    var tolerance = input.tolerance === undefined ? 0 : input.tolerance;
    ['measured', 'tolerance', 'toleranceMinus', 'tolerancePlus', 'resolution'].forEach(function (key) {
      if (input[key] !== undefined && !(input[key] === null && ['measured', 'resolution'].includes(key))) number(input[key], 0, 1000000, 'inspection ' + key);
    });
    var i = validateInspection({ id: input.id || id('inspection'), key: input.key, label: input.label || input.key, nominalMm: dimension(p, input.key),
      measuredMm: input.measured === null || input.measured === undefined ? null : input.measured * factor,
      toleranceMinusMm: (input.toleranceMinus === undefined ? tolerance : input.toleranceMinus) * factor,
      tolerancePlusMm: (input.tolerancePlus === undefined ? tolerance : input.tolerancePlus) * factor,
      resolutionMm: input.resolution === null || input.resolution === undefined ? null : input.resolution * factor,
      instrument: input.instrument || '', notes: input.notes || '', sourceFingerprint: geometryFingerprint(p), recordedAt: input.recordedAt || now() });
    p.workflow.inspections = p.workflow.inspections.filter(function (v) { return v.id !== i.id; }).concat([i]).slice(-50);
    return syncMetadata(p, raw);
  }
  function inspectionStatus(raw, input) {
    var i = validateInspection(input), stale = i.sourceFingerprint !== geometryFingerprint(raw);
    var low = i.nominalMm - i.toleranceMinusMm, high = i.nominalMm + i.tolerancePlusMm;
    var delta = i.measuredMm === null ? null : i.measuredMm - i.nominalMm;
    return { stale: stale, status: stale ? 'stale' : delta === null ? 'pending' : i.measuredMm >= low - 1e-9 && i.measuredMm <= high + 1e-9 ? 'within-tolerance' : 'outside-tolerance',
      deviationMm: delta, minimumMm: low, maximumMm: high, resolutionWarning: i.resolutionMm !== null && i.resolutionMm > i.toleranceMinusMm + i.tolerancePlusMm,
      message: 'Comparison uses the entered measurement and tolerance; it does not verify an actual machine or part.' };
  }
  function createAssignment(starter) {
    var titles = ['Use physical units', 'Explain the calculation', 'Check the design', 'Explain the process', 'Inspect and reflect'];
    return validateAssignment({ format: 'access-design-assignment', version: 1, id: id('assignment'), title: 'Design and explain a part', brief: '', starter: starter || 'any',
      criteria: titles.map(function (title, i) { return { id: 'criterion-' + (i + 1), title: title, description: '', maxScore: 4 }; }), requirements: [],
      reflectionPrompts: ['Which dimension mattered most?', 'Show one calculation you used.', 'What changed after checking the design?'], teacherNotes: '' });
  }
  function assign(raw, input) { var p = withMetadata(raw); p.workflow.assignment = validateAssignment(input); p.workflow.reviews = []; return syncMetadata(p, raw); }
  function review(raw, input) {
    var p = withMetadata(raw); if (!p.workflow.assignment) fail('Add an assignment before entering a review.');
    p.workflow.reviews = p.workflow.reviews.filter(function (r) { return r.criterionId !== input.criterionId; }).concat([{ criterionId: input.criterionId, score: input.score, comment: input.comment || '', reviewer: input.reviewer || '' }]);
    return syncMetadata(p, raw);
  }
  function assessment(raw) {
    var p = withMetadata(raw), m = p.workflow, assignment = m.assignment;
    var criteria = assignment ? assignment.criteria.map(function (c) { var r = m.reviews.find(function (v) { return v.criterionId === c.id; }); return { id: c.id, title: c.title, maxScore: c.maxScore, score: r ? r.score : null, comment: r ? r.comment : '', reviewer: r ? r.reviewer : '' }; }) : [];
    var requirements = assignment ? assignment.requirements.map(function (r) { var actual; try { actual = dimension(p, r.key); } catch (_) { actual = null; } return { key: r.key, targetMm: r.targetMm, actualMm: actual, toleranceMm: r.toleranceMm, met: actual !== null && Math.abs(actual - r.targetMm) <= r.toleranceMm + 1e-9 }; }) : [];
    return { criteria: criteria, requirements: requirements, totalPossible: criteria.reduce(function (n, c) { return n + c.maxScore; }, 0), totalAwarded: criteria.reduce(function (n, c) { return n + (c.score === null ? 0 : c.score); }, 0),
      complete: criteria.length > 0 && criteria.every(function (c) { return c.score !== null; }), reviewedCount: criteria.filter(function (c) { return c.score !== null; }).length,
      checkpoints: m.checkpoints.map(function (c) { return Object.assign({ id: c.id }, checkpointStatus(p, c)); }), inspections: m.inspections.map(function (i) { return Object.assign({ id: i.id }, inspectionStatus(p, i)); }),
      results: m.results.map(function (r) { return Object.assign({ id: r.id }, resultStatus(p, r)); }), note: 'Rubric scores are entered by a reviewer. Automated checks do not award marks or certify machining quality.' };
  }
  function bytes(text) { try { return encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, 'x').length; } catch (_) { fail('The file contains invalid Unicode.'); } }
  function parse(text, max) { if (typeof text !== 'string' || bytes(text) > max) fail('The file exceeds its size limit.'); try { return JSON.parse(text); } catch (_) { fail('The file is not valid JSON.'); } }
  function assignmentJSON(a) { return JSON.stringify(validateAssignment(a), null, 2); }
  function importAssignment(text) { return validateAssignment(parse(text, 65536)); }
  function submission(raw, at) { var p = withMetadata(raw); return { format: 'access-design-submission', version: 1, submittedAt: date(at || now(), 'submission date'), project: p, assessment: assessment(p) }; }
  function createLibrary() { return { format: 'access-design-library', version: 1, activeId: null, entries: [] }; }
  function validateLibrary(raw) {
    record(raw, ['format', 'version', 'activeId', 'entries'], 'library');
    if (raw.format !== 'access-design-library' || raw.version !== 1) fail('Unsupported project library format or version.');
    var entries = list(raw.entries, MAX_PROJECTS, function (e) {
      record(e, ['id', 'project', 'updatedAt', 'revisions'], 'library entry');
      var p = withMetadata(e.project); if (e.id !== p.id) fail('Library project identity does not match.');
      var last = 0, revisions = list(e.revisions, MAX_REVISIONS, function (r) {
        record(r, ['number', 'label', 'at', 'project'], 'revision'); var n = number(r.number, 1, 1000000000, 'revision number', true), snap = withMetadata(r.project);
        if (n <= last || snap.id !== p.id) fail('Revision order or project identity is invalid.'); last = n;
        return { number: n, label: str(r.label, 160, 'revision label', true), at: date(r.at, 'revision date'), project: snap };
      }, 'revisions');
      if (last > p.workflow.revision) fail('A stored revision is newer than the current project.');
      return { id: p.id, project: p, updatedAt: date(e.updatedAt, 'project update date'), revisions: revisions };
    }, 'projects');
    var activeId = raw.activeId === null ? null : str(raw.activeId, 100, 'active project', true);
    if (activeId !== null && !entries.some(function (e) { return e.id === activeId; })) fail('The active project is missing from this library.');
    var result = { format: raw.format, version: 1, activeId: activeId, entries: entries };
    if (bytes(JSON.stringify(result)) > MAX_BYTES) fail('The project library exceeds 4 MB. Export it and remove older projects or revisions.');
    return result;
  }
  function upsert(raw, input, label, at) {
    var lib = validateLibrary(raw), p = withMetadata(input), time = date(at || now(), 'save date'), e = lib.entries.find(function (x) { return x.id === p.id; }), isNew = !e;
    if (!e) { if (lib.entries.length >= MAX_PROJECTS) fail('The library has 20 projects. Export it and remove a project before adding another.'); e = { id: p.id, project: p, updatedAt: time, revisions: [] }; lib.entries.push(e); }
    var named = label && !['Saved edit', 'First saved version'].includes(label);
    var pinned = function (r) { return !['Saved edit', 'First saved version'].includes(r.label); };
    if (named && e.revisions.filter(pinned).length >= MAX_REVISIONS) fail('This project already has 12 named versions. Export the library or remove an older named version before naming another.');
    if (named || isNew || stable(e.project) !== stable(p)) {
      var revision = isNew ? p.workflow.revision : e.project.workflow.revision + 1;
      p.workflow.revision = revision;
      e.project = p; e.updatedAt = time;
      // The current project is the autosave head. Twelve named historical versions may
      // occupy every snapshot slot without preventing edits to that separate head.
      if (named || e.revisions.filter(pinned).length < MAX_REVISIONS) {
        e.revisions.push({ number: revision, label: str(label || (isNew ? 'First saved version' : 'Saved edit'), 160, 'revision label', true), at: time, project: clone(p) });
        while (e.revisions.length > MAX_REVISIONS) { var removable = e.revisions.findIndex(function (r) { return !pinned(r); }); if (removable < 0) fail('Too many named versions.'); e.revisions.splice(removable, 1); }
      }
    }
    lib.activeId = p.id;
    return validateLibrary(lib);
  }
  function open(raw, projectId) { var lib = validateLibrary(raw), e = lib.entries.find(function (x) { return x.id === projectId; }); if (!e) fail('That project is not in this library.'); return clone(e.project); }
  function activate(raw, projectId) { var lib = validateLibrary(raw); open(lib, projectId); lib.activeId = projectId; return lib; }
  function restoreRevision(raw, projectId, n, at) { var lib = validateLibrary(raw), e = lib.entries.find(function (x) { return x.id === projectId; }), r = e && e.revisions.find(function (x) { return x.number === n; }); if (!r) fail('That revision is not available.'); return upsert(lib, r.project, 'Saved edit', at); }
  function removeRevision(raw, projectId, n) { var lib = validateLibrary(raw), e = lib.entries.find(function (x) { return x.id === projectId; }); if (!e || !e.revisions.some(function (r) { return r.number === n; })) fail('That revision is not available.'); e.revisions = e.revisions.filter(function (r) { return r.number !== n; }); return lib; }
  function remove(raw, projectId) { var lib = validateLibrary(raw); if (!lib.entries.some(function (e) { return e.id === projectId; })) fail('That project is not in this library.'); lib.entries = lib.entries.filter(function (e) { return e.id !== projectId; }); if (lib.activeId === projectId) lib.activeId = lib.entries.length ? lib.entries[lib.entries.length - 1].id : null; return lib; }
  // Use the same compact representation as the validated storage budget. Pretty
  // printing can push a valid near-limit backup over the importer's 4 MiB limit.
  function exportLibrary(raw) { return JSON.stringify(validateLibrary(raw)); }
  function importLibrary(text) { return validateLibrary(parse(text, MAX_BYTES)); }
  function mergeLibrary(current, incoming) {
    var lib = validateLibrary(current), source = validateLibrary(incoming), imported = 0, copied = 0, skipped = 0, importedActive = null;
    source.entries.forEach(function (entry) {
      var existing = lib.entries.find(function (e) { return e.id === entry.id; }), next = clone(entry);
      if (existing && stable({ project: existing.project, revisions: existing.revisions }) === stable({ project: entry.project, revisions: entry.revisions })) { skipped++; if (source.activeId === entry.id) importedActive = existing.id; return; }
      if (lib.entries.length >= MAX_PROJECTS) fail('Import would exceed 20 projects. Export the current library and remove projects before importing this backup.');
      if (existing) {
        next.id = id('imported');
        [next.project].concat(next.revisions.map(function (r) { return r.project; })).forEach(function (p) { p.id = next.id; p.title = p.title.slice(0, 144) + ' (imported copy)'; });
        // Retain evidence provenance. Changed project identity makes old dependency
        // fingerprints stale rather than relabelling historic evidence as newly run.
        copied++;
      } else imported++;
      lib.entries.push(next); if (source.activeId === entry.id) importedActive = next.id;
    });
    if (!lib.activeId && importedActive) lib.activeId = importedActive;
    return { library: validateLibrary(lib), imported: imported, copied: copied, skipped: skipped };
  }
  function saveLibrary(storage, raw) {
    var lib = validateLibrary(raw), text = JSON.stringify(lib);
    try { storage.setItem(KEY, text); return { ok: true, library: lib, message: 'Project library saved in this browser.' }; }
    catch (_) { return { ok: false, library: lib, message: 'Browser saving is unavailable. Download the library to keep these projects.' }; }
  }
  function loadLibrary(storage) {
    try { var text = storage.getItem(KEY); if (!text) return { ok: true, library: createLibrary(), message: '' }; return { ok: true, library: importLibrary(text), message: '' }; }
    catch (_) { return { ok: false, library: createLibrary(), message: 'The saved library is unavailable or damaged. Its stored record was left unchanged; open a downloaded library to recover your work.' }; }
  }
  return Object.freeze({ storageKey: KEY, limits: { projects: MAX_PROJECTS, revisions: MAX_REVISIONS, bytes: MAX_BYTES }, defaultMetadata: defaults, validateMetadata: validateMetadata, validateOperation: validateOperation, validateSequence: validateSequence, getSequence: getSequence, sequence: getSequence, setSequence: setSequence,
    validateComparison: validateComparison, validateComparisonResult: validateComparisonResult, getComparison: getComparison, comparisonState: comparisonState, setComparison: setComparison,
    fingerprint: fingerprint, geometryFingerprint: geometryFingerprint, syncMetadata: syncMetadata, withMetadata: withMetadata, ensure: withMetadata, setOperation: setOperation, recordResult: recordResult, resultStatus: resultStatus,
    addCheckpoint: addCheckpoint, checkpointStatus: checkpointStatus, dimension: dimension, inspect: inspect, inspectionStatus: inspectionStatus,
    createAssignment: createAssignment, validateAssignment: validateAssignment, assignmentJSON: assignmentJSON, importAssignment: importAssignment, assign: assign, review: review, assessment: assessment, submission: submission,
    createLibrary: createLibrary, validateLibrary: validateLibrary, upsert: upsert, open: open, activate: activate, restoreRevision: restoreRevision, removeRevision: removeRevision, remove: remove, saveLibrary: saveLibrary, loadLibrary: loadLibrary, exportLibrary: exportLibrary, importLibrary: importLibrary, mergeLibrary: mergeLibrary });
});
