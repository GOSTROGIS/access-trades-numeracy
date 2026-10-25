/* Manual machining history and teaching G-code. Geometry is supplied to the
   existing simulator in inches; all learner-facing model values use config.units. */
(function (root) {
  'use strict';
  const MM_PER_INCH = 25.4;
  const MAX_ACTIONS = 1000;
  const clone = value => JSON.parse(JSON.stringify(value));
  const deepFreeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  };
  function finite(value, label, minimum, maximum) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw Error(label + ' must be a finite number.');
    // Unit scaling can put an exact decimal boundary a few binary ULPs away
    // (24 * 25.4 is 609.5999999999999). Accept only that arithmetic noise;
    // keep the input unchanged and reject dimensions genuinely outside the limit.
    const tolerance = bound => 8 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(bound));
    const display = bound => Number(bound.toPrecision(12));
    if (minimum !== undefined && value < minimum - tolerance(minimum)) throw Error(label + ' must be at least ' + display(minimum) + '.');
    if (maximum !== undefined && value > maximum + tolerance(maximum)) throw Error(label + ' must be no more than ' + display(maximum) + '.');
    return value;
  }
  function unitScale(units) {
    if (!['mm', 'in'].includes(units)) throw Error('Choose millimetres or inches.');
    return units === 'mm' ? MM_PER_INCH : 1;
  }
  function precision(units) { return units === 'mm' ? 3 : 4; }
  function quantize(value, units) {
    const out = Number(value.toFixed(precision(units)));
    return Object.is(out, -0) ? 0 : out;
  }
  function format(value, units) { return quantize(finite(value, 'Value'), units).toFixed(precision(units)); }
  function comment(value) {
    return String(value || '').replace(/[^\x20-\x7e]/g, ' ').replace(/[()%]/g, '').replace(/\s+/g, ' ').trim().slice(0, 72);
  }
  function defaultConfig(machine = 'mill', units = 'mm') {
    if (!['mill', 'lathe'].includes(machine)) throw Error('Choose the mill or the lathe.');
    unitScale(units);
    const metric = units === 'mm';
    return {
      machine, units,
      title: machine === 'mill' ? 'Manual milling practice' : 'Manual turning practice',
      programNumber: machine === 'mill' ? 9001 : 9002,
      stock: machine === 'mill'
        ? { x: metric ? 100 : 4, y: metric ? 70 : 3, z: metric ? 20 : 0.75 }
        : { diameter: metric ? 40 : 1.5, length: metric ? 80 : 3 },
      tool: machine === 'mill'
        ? { type: 'endmill', diameter: metric ? 6 : 0.25, length: metric ? 100 : 4 }
        : { type: 'turn', width: metric ? 3 : 0.125 },
      clearance: metric ? 5 : 0.2,
      feed: machine === 'mill' ? (metric ? 120 : 5) : (metric ? 80 : 3),
      rpm: machine === 'mill' ? 1800 : 1200,
      jog: metric ? 1 : 0.05,
    };
  }
  function normalizeConfig(input) {
    if (!input || typeof input !== 'object') throw Error('A machining setup is required.');
    const c = clone(input);
    if (!['mill', 'lathe'].includes(c.machine)) throw Error('Choose the mill or the lathe.');
    const scale = unitScale(c.units);
    const defaults = defaultConfig(c.machine, c.units);
    for (const key of ['title', 'programNumber', 'clearance', 'feed', 'rpm', 'jog']) {
      if (c[key] === undefined) c[key] = defaults[key];
    }
    c.title = comment(c.title) || defaults.title;
    finite(c.programNumber, 'Program number', 1, 99999);
    if (!Number.isInteger(c.programNumber)) throw Error('Program number must be a whole number.');
    c.clearance = quantize(finite(c.clearance, 'Clearance', 0.02 * scale, 2 * scale), c.units);
    c.feed = quantize(finite(c.feed, 'Feed', 0.001 * scale, 600 * scale), c.units);
    c.rpm = finite(c.rpm, 'Spindle speed', 1, c.machine === 'mill' ? 8100 : 6000);
    if (!Number.isInteger(c.rpm)) throw Error('Spindle speed must be a whole number of RPM.');
    c.jog = quantize(finite(c.jog, 'Jog step', 0.0001 * scale, 2 * scale), c.units);
    if (!c.stock || !c.tool) throw Error('Stock dimensions and a tool are required.');
    if (c.machine === 'mill') {
      c.stock = {
        x: quantize(finite(c.stock.x, 'Stock X length', 0.25 * scale, 24 * scale), c.units),
        y: quantize(finite(c.stock.y, 'Stock Y width', 0.25 * scale, 12 * scale), c.units),
        z: quantize(finite(c.stock.z, 'Stock thickness', 0.125 * scale, 4 * scale), c.units),
      };
      if (c.tool.type !== undefined && c.tool.type !== 'endmill') throw Error('Manual milling uses a flat end mill.');
      c.tool = {
        type: 'endmill',
        diameter: quantize(finite(c.tool.diameter, 'Tool diameter', 0.02 * scale, 2 * scale), c.units),
        length: quantize(finite(c.tool.length === undefined ? defaults.tool.length : c.tool.length, 'Tool length', 2.5 * scale, 8 * scale), c.units),
      };
    } else {
      c.stock = {
        diameter: quantize(finite(c.stock.diameter, 'Stock diameter', 0.25 * scale, 6 * scale), c.units),
        length: quantize(finite(c.stock.length, 'Stock length', 0.5 * scale, 10 * scale), c.units),
      };
      const type = c.tool.type || 'turn';
      if (!['turn', 'part'].includes(type)) throw Error('Choose a turning or parting tool.');
      c.tool = { type, width: quantize(finite(c.tool.width === undefined ? defaults.tool.width : c.tool.width, 'Tool width', 0.02 * scale, 0.5 * scale), c.units) };
    }
    return c;
  }
  function startPosition(c) {
    if (c.machine === 'mill') {
      const outside = quantize(-c.tool.diameter / 2 - c.clearance, c.units);
      return { x: outside, y: outside, z: c.clearance };
    }
    return { x: quantize(c.stock.diameter + c.clearance * 2, c.units), y: 0, z: c.clearance };
  }
  function create(input) {
    const config = normalizeConfig(input || defaultConfig());
    const position = startPosition(config);
    checkPosition(config, position);
    return deepFreeze({ config, actions: [], position, spindle: { on: false, rpm: config.rpm }, coolant: false, feed: config.feed });
  }
  function checkPosition(c, p) {
    const scale = unitScale(c.units);
    if (c.machine === 'mill') {
      const xmin = -15 * scale + c.stock.x / 2, xmax = 15 * scale + c.stock.x / 2;
      const ymin = -8 * scale + c.stock.y / 2, ymax = 8 * scale + c.stock.y / 2;
      finite(p.x, 'X position', xmin, xmax);
      finite(p.y, 'Y position', ymin, ymax);
      // The simulator performs the final gauge-line Z and fixture checks.
      finite(p.z, 'Z position', -c.stock.z - 3 * scale, 10 * scale);
    } else {
      finite(p.x, 'X diameter', 0, 15.26 * scale);
      finite(p.z, 'Z position', -c.stock.length - 0.5 * scale, 13.5 * scale - c.stock.length);
      if (p.y !== 0) throw Error('The two-axis lathe uses X diameter and Z; Y must be zero.');
    }
  }
  function reduce(state, input) {
    if (!input || typeof input !== 'object') throw Error('Choose a machining action.');
    const c = state.config, scale = unitScale(c.units);
    let action, position = { ...state.position }, spindle = { ...state.spindle }, coolant = state.coolant, feed = state.feed;
    switch (input.type) {
      case 'move': {
        if (!['rapid', 'feed'].includes(input.motion)) throw Error('Choose Rapid or Feed movement.');
        if (!input.target || typeof input.target !== 'object' || !Object.keys(input.target).length) throw Error('Enter a target position.');
        for (const [axis, value] of Object.entries(input.target)) {
          if (!['x', 'y', 'z'].includes(axis)) throw Error('Unknown movement axis: ' + axis + '.');
          position[axis] = quantize(finite(value, axis.toUpperCase() + ' position'), c.units);
        }
        checkPosition(c, position);
        if (['x', 'y', 'z'].every(axis => position[axis] === state.position[axis])) return state;
        if (input.motion === 'feed') {
          if (!spindle.on) throw Error('Start the spindle before a feed move.');
          feed = quantize(finite(input.feed === undefined ? feed : input.feed, 'Feed', 0.001 * scale, 600 * scale), c.units);
        }
        action = { type: 'move', target: position, motion: input.motion, feed: input.motion === 'feed' ? feed : null };
        break;
      }
      case 'spindle': {
        if (typeof input.on !== 'boolean') throw Error('Choose spindle on or off.');
        const rpm = finite(input.rpm === undefined ? spindle.rpm : input.rpm, 'Spindle speed', 1, c.machine === 'mill' ? 8100 : 6000);
        if (!Number.isInteger(rpm)) throw Error('Spindle speed must be a whole number of RPM.');
        spindle = { on: input.on, rpm };
        if (spindle.on === state.spindle.on && spindle.rpm === state.spindle.rpm) return state;
        action = { type: 'spindle', ...spindle };
        break;
      }
      case 'coolant':
        if (typeof input.on !== 'boolean') throw Error('Choose coolant on or off.');
        coolant = input.on;
        if (coolant === state.coolant) return state;
        action = { type: 'coolant', on: coolant };
        break;
      case 'feed':
        feed = quantize(finite(input.value, 'Feed', 0.001 * scale, 600 * scale), c.units);
        if (feed === state.feed) return state;
        action = { type: 'feed', value: feed };
        break;
      case 'dwell':
        action = { type: 'dwell', seconds: Number(finite(input.seconds, 'Dwell time', 0.001, 30).toFixed(3)) };
        break;
      case 'retract':
        position = c.machine === 'mill'
          ? { ...position, z: Math.max(position.z, c.clearance) }
          : { ...position, x: Math.max(position.x, c.stock.diameter + c.clearance * 2), z: Math.max(position.z, c.clearance) };
        position.x = quantize(position.x, c.units); position.z = quantize(position.z, c.units);
        checkPosition(c, position);
        if (['x', 'y', 'z'].every(axis => position[axis] === state.position[axis])) return state;
        action = { type: 'retract', target: position };
        break;
      default: throw Error('Unknown machining action.');
    }
    if (state.actions.length >= MAX_ACTIONS) throw Error('This practice program has reached 1,000 actions. Save it and start a new setup.');
    return deepFreeze({ config: c, actions: [...state.actions, action], position, spindle, coolant, feed });
  }
  function apply(state, action) {
    if (!state || !state.config || !Array.isArray(state.actions)) throw Error('Start a machining setup first.');
    return reduce(state, action);
  }
  function rebuild(config, actions = []) {
    if (!Array.isArray(actions) || actions.length > MAX_ACTIONS) throw Error('This action history is not valid.');
    return actions.reduce((state, action) => reduce(state, action), create(config));
  }
  function undo(state) { return rebuild(state.config, state.actions.slice(0, -1)); }
  function lines(state, options = {}) {
    const c = state.config, f = n => format(n, c.units), initial = startPosition(c), rows = [];
    const add = (text, actionIndex = null, kind = 'setup') => rows.push({ text, actionIndex, kind, line: rows.length + 1 });
    add('%'); add('O' + String(c.programNumber).padStart(5, '0') + ' (' + comment(c.title).toUpperCase() + ')');
    add('(MANUAL PRACTICE - ' + (c.units === 'mm' ? 'MILLIMETRES' : 'INCHES') + ')');
    if (c.machine === 'mill') {
      add('(G54 X0 Y0: STOCK LOWER LEFT / Z0: TOP)');
      add('(T1: FLAT END MILL / DIAMETER ' + f(c.tool.diameter) + ')');
      add((c.units === 'mm' ? 'G21' : 'G20') + ' G17 G90 G40 G49 G80 G94');
      add('T1 M06'); add('G54');
      add('G00 X' + f(initial.x) + ' Y' + f(initial.y));
      add('G43 H01 Z' + f(initial.z));
    } else {
      add('(G54 X: DIAMETER / Z0: FRONT FACE / NEGATIVE Z: TOWARD CHUCK)');
      add('(T0101: ' + (c.tool.type === 'part' ? 'PARTING TOOL / WIDTH ' + f(c.tool.width) : 'TURNING TOOL') + ')');
      add((c.units === 'mm' ? 'G21' : 'G20') + ' G18 G40 G80 G98 G97');
      add('T0101'); add('G54');
      add('G00 X' + f(initial.x)); add('G00 Z' + f(initial.z));
    }
    let previous = initial;
    state.actions.forEach((a, index) => {
      const emit = text => add(text, index, 'action');
      if (a.type === 'move') {
        const axes = c.machine === 'mill' ? ['x', 'y', 'z'] : ['x', 'z'];
        const words = axes.filter(axis => a.target[axis] !== previous[axis]).map(axis => axis.toUpperCase() + f(a.target[axis]));
        emit((a.motion === 'rapid' ? 'G00 ' : 'G01 ') + words.join(' ') + (a.motion === 'feed' ? ' F' + f(a.feed) : ''));
        previous = a.target;
      } else if (a.type === 'spindle') emit('S' + a.rpm + (a.on ? ' M03' : ' M05'));
      else if (a.type === 'coolant') emit(a.on ? 'M08' : 'M09');
      else if (a.type === 'feed') emit('F' + f(a.value));
      else if (a.type === 'dwell') emit('G04 P' + a.seconds.toFixed(3));
      else if (a.type === 'retract') {
        if (c.machine === 'lathe' && a.target.x !== previous.x) emit('G00 X' + f(a.target.x));
        if (a.target.z !== previous.z) emit('G00 Z' + f(a.target.z));
        previous = a.target;
      }
    });
    if (options.complete) {
      const finish = text => add(text, null, 'finish');
      if (c.machine === 'lathe') {
        const x = quantize(Math.max(state.position.x, c.stock.diameter + c.clearance * 2), c.units);
        if (x !== state.position.x) finish('G00 X' + f(x));
      }
      const z = Math.max(state.position.z, c.clearance);
      if (z !== state.position.z) finish('G00 Z' + f(z));
      finish('M09'); finish('M05'); finish('M30'); finish('%');
    }
    return rows;
  }
  function code(state, options = {}) { return lines(state, options).map(row => row.text).join('\n') + '\n'; }
  function project(state, options = {}) {
    const c = state.config, scale = unitScale(c.units), inch = n => n / scale;
    const mill = c.machine === 'mill';
    return {
      id: 'CNC-999', machine: c.machine, gen: 'classic', title: c.title,
      text: code(state, options), showToolpath: true,
      stock: mill
        ? { x: inch(c.stock.x), y: inch(c.stock.y), z: inch(c.stock.z) }
        : { dia: inch(c.stock.diameter), stickout: inch(c.stock.length), extra: 0 },
      tools: { 1: mill
        ? { name: fTool(c.tool.diameter, c.units) + ' flat end mill', type: 'endmill', shape: 'flat', dia: inch(c.tool.diameter), len: inch(c.tool.length), color: '#D2181F' }
        : { name: c.tool.type === 'part' ? 'Parting tool' : 'Turning tool', type: c.tool.type, dia: 0, len: 0, width: inch(c.tool.width), color: '#D2181F' } },
      setup: mill
        ? { method: 'vise', params: { grip: Math.max(0.05, Math.min(inch(c.stock.z) * 0.25, 0.5)), parallels: 'jaws' } }
        : { method: 'chuck3', params: {} },
    };
  }
  function fTool(value, units) { return String(value) + ' ' + units; }
  const api = { defaultConfig, create, apply, rebuild, undo, code, lines, project, format, startPosition, limits: { maxActions: MAX_ACTIONS } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CNCManual = api;
})(typeof window !== 'undefined' ? window : globalThis);
