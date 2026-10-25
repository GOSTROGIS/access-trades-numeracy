/* A physical-dimension bridge between Shape Canvas and the student design project.
   Page coordinates, drawing scale, labels and view rotation are presentation only.
   Optional object.designProject metadata travels with the existing drawing JSON. */
(function (W) {
  'use strict';
  var SC = W.SC, D = W.AccessDesign;
  if (!SC) return;
  var workspace = '../numeracy-hub/design/index.html';
  var pending = null, mode = 'send';
  var $ = function (id) { return W.document.getElementById(id); };

  function model() {
    if (!D) throw new Error('The design workspace could not load. Reload this page and try again.');
    return D;
  }

  function compositeRings(o) {
    var members = SC.Co.members(o);
    if (members.some(function (part) { return Math.abs(part.ppu / o.ppu - 1) > 1e-8; })) throw new Error('The composite members use different drawing scales. Rebuild the composite at one scale before sending its measured outline.');
    var outline = SC.Co.outline(o);
    if (!outline.ok || !outline.pieces.length) throw new Error('This composite does not have a closed outline. Check its overlapping edges and cut-outs.');
    var edges = outline.pieces, used = {}, rings = [];
    edges.forEach(function (start, i) {
      if (used[i]) return;
      var current = start, index = i, ring = [], guard = 0;
      do {
        if (used[index] || guard++ > edges.length) throw new Error('The composite outline cannot be joined into closed rings.');
        used[index] = true; ring.push([current.a[0], -current.a[1]]);
        if (current.kb === start.ka) break;
        index = edges.findIndex(function (edge, j) { return !used[j] && edge.ka === current.kb; });
        if (index < 0) throw new Error('The composite outline has an open edge.');
        current = edges[index];
      } while (true);
      rings.push(ring);
    });
    return rings;
  }

  function projectForObject(o) {
    var m = SC.M, project;
    if (o && o.comp && SC.Co) o = SC.Co.compOf(o);
    if (!o) throw new Error('Select a flat shape, a composite, an imported design profile, or a cylinder.');
    if (o.type === 'comp' && SC.Co) {
      project = model().fromProfile({ rings: compositeRings(o), units: m.unit(), title: o.name || 'My composite design' });
    } else if (o.type === 'svg' && o.designProject && o.designProject.geometry && o.designProject.geometry.shapeId === 'profile') {
      // The SVG is an annotation view. Its screen size and crop never redefine the measured profile.
      project = model().validate(o.designProject);
    } else if (o.type === 'shape') {
      model().geometryInfo({ shapeId: o.shape, params: o.params, ao: o.ao });
      var validation = W.Shapes.validate(o.shape, o.params, o.ao);
      if (validation) throw new Error(validation.msg);
      project = model().fromCanvas({ shapeId: o.shape, params: o.params, ao: o.ao && o.ao.angles !== undefined ? o.ao : undefined, units: m.unit(), title: o.name || 'My design project' });
    } else {
      throw new Error('This project supports flat shapes, composites and cylinders. Import other measured drawings through the design workspace.');
    }
    if (o.designProject) {
      var original = model().validate(o.designProject);
      var before = model().validate(original);
      original.geometry = project.geometry;
      original.units = project.units;
      project = model().validate(original);
      if (W.AccessDesignWorkflow && original.workflow) project = W.AccessDesignWorkflow.syncMetadata(project, before);
    }
    return project;
  }

  function selectedObject() {
    if (SC.S.sel.length !== 1) throw new Error('Select one flat shape, composite or cylinder to use its dimensions.');
    var o = SC.M.obj(SC.S.sel[0]);
    return o && o.comp && SC.Co ? SC.Co.compOf(o) : o;
  }
  function selectedProject() { return projectForObject(selectedObject()); }
  function equivalent(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return a === b;
    var keys = Object.keys(a); return keys.length === Object.keys(b).length && keys.every(function (k) { return Object.prototype.hasOwnProperty.call(b, k) && equivalent(a[k], b[k]); });
  }
  function incomingStatus(raw) {
    var project = model().validate(raw), found = [];
    SC.M.doc.pages.forEach(function (p) { p.objs.forEach(function (o) { if (o.designProject && o.designProject.id === project.id) found.push(o); }); });
    if (!found.length) return { kind: 'new' };
    if (found.length !== 1) return { kind: 'conflict', message: 'Several canvas objects have this project ID. Add a separate page to keep every copy.' };
    var o = found[0], baseline = model().validate(o.designProject), current = projectForObject(o);
    if (!equivalent(current.geometry, baseline.geometry) && !equivalent(current.geometry, project.geometry)) return { kind: 'conflict', object: o, message: 'The canvas dimensions changed since this project was last sent. Add a separate page to compare both versions.' };
    if (baseline.workflow && !project.workflow) return { kind: 'conflict', object: o, message: 'This incoming copy has no workflow record, but the canvas copy has saved learning evidence. Add a separate page to preserve that evidence.' };
    if (baseline.workflow && project.workflow && project.workflow.revision < baseline.workflow.revision) return { kind: 'conflict', object: o, message: 'This project is an older revision than the canvas copy. Add a separate page to compare it.' };
    if (SC.M.layer(o.layer).locked || o.type === 'comp') return { kind: 'conflict', object: o, message: 'The linked drawing is locked or is an editable composite. Add a separate page to preserve it.' };
    if (SC.M.linksOf && SC.M.linksOf(o).length) return { kind: 'conflict', object: o, message: 'This drawing has linked dimensions. Add a separate page to preserve those relationships.' };
    return { kind: equivalent(current, project) ? 'same' : 'update', object: o };
  }
  function addProfile(project, at) {
    var m = SC.M, bounds = model().bounds(project), markup = model().render(project, 'mm');
    var span = Math.max(bounds.width, bounds.height), w = 280 * bounds.width / span, h = 280 * bounds.height / span;
    var o = { id: SC.U.uid('sv'), type: 'svg', asset: m.addAsset(SC.C.svgUrl(markup)), nat: [bounds.width, bounds.height], crop: { l: 0, t: 0, r: 0, b: 0 }, x: at ? at.x : -w / 2, y: at ? at.y : -h / 2, w: w, h: h, rot: 0, layer: m.doc.activeLayer };
    m.objs().push(o); return o;
  }
  function importProject(raw, options) {
    // Validate every input before making any change to the student's drawing.
    var project = model().validate(raw), m = SC.M;
    var converted = model().toCanvas(project, m.unit());
    var profile = converted.shapeId === 'profile';
    var validation = profile ? null : W.Shapes.validate(converted.shapeId, converted.params, converted.ao);
    if (validation) throw new Error(validation.msg);
    var status = options && options.mode === 'new' ? { kind: 'new' } : incomingStatus(project);
    if (status.kind === 'conflict') throw new Error(status.message);
    var before = m.snapshot(), selection = SC.S.sel.slice();
    try {
      var layer = m.doc.layers.filter(function (l) { return !l.hidden && !l.locked; })[0];
      if (!layer) {
        layer = { id: SC.U.uid('L'), name: 'Design project', hidden: false, locked: false };
        m.doc.layers.push(layer);
      }
      m.doc.activeLayer = layer.id;
      var o = status.object;
      if (o) {
        m.doc.page = m.doc.pages.indexOf(m.pageOf(o.id));
        if (status.kind !== 'same') {
          if (!profile && o.type === 'shape' && o.shape === converted.shapeId) {
            o.params = converted.params; o.ao = converted.ao || {}; m.syncPieces(o);
          } else {
            // Replacement is allowed only for an isolated linked view; keep attached work safe.
            if (o.type === 'shape' && m.objs().some(function (q) { return q.src === o.id || q.anchor && q.anchor.o === o.id; })) throw new Error('This shape has linked nets or notes. Add a separate page to preserve those links.');
            var old = o, index = m.objs().indexOf(old);
            o = profile ? addProfile(project, old) : m.addShape(converted.shapeId, old.x, old.y, converted.params);
            m.objs().splice(m.objs().indexOf(o), 1); m.objs()[index] = o; o.id = old.id; o.layer = old.layer;
            if (!profile && converted.ao) o.ao = converted.ao;
          }
        }
      } else {
        m.doc.pages.push({ id: SC.U.uid('p'), name: 'Design: ' + project.title, objs: [], links: [] });
        m.doc.page = m.doc.pages.length - 1;
        o = profile ? addProfile(project) : m.addShape(converted.shapeId, 0, 0, converted.params);
        if (!profile && converted.ao) o.ao = converted.ao;
      }
      o.name = project.title;
      o.designProject = project;
      SC.S.sel = [o.id];
      SC.A.afterLoad();
      SC.I.commit();
      SC.P.toast(status.kind === 'new' ? 'Design added on a new page. Undo removes the added page.' : status.kind === 'same' ? 'Opened the linked design. It is already up to date.' : 'Linked design updated. Undo restores the previous dimensions.');
      return o.id;
    } catch (error) {
      m.restore(before);
      SC.S.sel = selection;
      SC.A.afterLoad();
      throw error;
    }
  }

  function clearIncomingLink() {
    if (W.location.hash.indexOf('#project=') === 0) {
      try { W.history.replaceState(null, '', W.location.pathname + W.location.search); } catch (error) { /* A file opened locally may restrict history. */ }
    }
  }

  function showDialog() {
    SC.P.closePops();
    var dialog = $('design-project-dialog');
    if (!dialog.open) dialog.showModal();
  }

  function openSend() {
    mode = 'send'; pending = null;
    $('design-project-new').hidden = true;
    $('design-project-heading').textContent = 'Continue your design';
    $('design-project-workspace').hidden = false;
    $('design-project-primary').hidden = false;
    $('design-project-primary').textContent = 'Use selected shape';
    $('design-project-note').textContent = 'Real dimensions carry over. Composites use their measured outline at a shared scale. Imported profiles keep their stored dimensions; resizing their canvas picture changes only the view. Edit profile measurements in the workspace.';
    try {
      pending = selectedProject();
      var o = selectedObject();
      $('design-project-summary').textContent = o.name + ' is ready to use. Check its dimensions and stock in the workspace.';
      if (o.designProject) $('design-project-primary').textContent = 'Return to design project';
      $('design-project-primary').disabled = false;
    } catch (error) {
      $('design-project-summary').textContent = error.message;
      $('design-project-primary').disabled = true;
    }
    showDialog();
  }

  function openIncoming() {
    if (W.location.hash.indexOf('#project=') !== 0) return;
    mode = 'import'; pending = null;
    $('design-project-new').hidden = true;
    $('design-project-heading').textContent = 'Bring your design onto the canvas';
    $('design-project-primary').textContent = 'Add as a new page';
    $('design-project-primary').hidden = false;
    $('design-project-workspace').hidden = true;
    $('design-project-note').textContent = 'The design will be added on a new page. Its real dimensions are converted to your drawing units. Your other pages stay here, and you can undo the addition.';
    try {
      pending = model().decode(W.location.hash.slice('#project='.length));
      pending = model().validate(pending);
      var status = incomingStatus(pending);
      $('design-project-summary').textContent = pending.title + ' · ' + model().geometryInfo(pending).name + (status.message ? '. ' + status.message : '');
      $('design-project-primary').textContent = status.kind === 'new' ? 'Add as a new page' : status.kind === 'same' ? 'Open linked design' : 'Update linked design';
      $('design-project-primary').disabled = status.kind === 'conflict';
      $('design-project-new').hidden = status.kind === 'new';
      if (status.kind !== 'new') $('design-project-note').textContent = 'Update keeps the existing page and annotations. Add a separate page to compare versions. Both actions can be undone.';
    } catch (error) {
      $('design-project-summary').textContent = 'This design could not be opened: ' + error.message;
      $('design-project-primary').disabled = true;
    }
    showDialog();
  }

  function init() {
    $('btn-design-project').addEventListener('click', openSend);
    $('design-project-new').addEventListener('click', function () {
      if (!pending || mode !== 'import') return;
      try { importProject(pending, { mode: 'new' }); clearIncomingLink(); $('design-project-dialog').close(); } catch (error) { $('design-project-summary').textContent = error.message; }
    });
    $('design-project-workspace').addEventListener('click', function () { SC.M.save(); });
    $('design-project-primary').addEventListener('click', function () {
      if (!pending) return;
      try {
        if (mode === 'import') {
          importProject(pending);
          clearIncomingLink();
          $('design-project-dialog').close();
        } else {
          // Re-read selection so the exported dimensions always reflect the drawing.
          var outgoing = selectedProject(), link = workspace + '#project=' + model().encode(outgoing);
          selectedObject().designProject = outgoing;
          SC.I.commit();
          // The canvas normally debounces saving. Flush before leaving this document.
          SC.M.save();
          W.location.href = link;
        }
      } catch (error) {
        $('design-project-summary').textContent = error.message;
      }
    });
    $('design-project-dialog').addEventListener('close', function () {
      if (mode === 'import') clearIncomingLink();
      pending = null;
      $('btn-design-project').focus();
    });
    // Canvas shortcuts must not operate on shapes while the project dialog is open.
    $('design-project-dialog').addEventListener('keydown', function (event) { event.stopPropagation(); });
    W.addEventListener('hashchange', openIncoming);
    openIncoming();
  }

  SC.DesignBridge = { selectedProject: selectedProject, importProject: importProject, incomingStatus: incomingStatus };
  if (W.document.readyState === 'loading') W.document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
