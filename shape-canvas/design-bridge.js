/* A physical-dimension bridge between Shape Canvas and the student design project.
   Page coordinates, drawing scale, labels and view rotation are presentation only.
   Optional object.designProject metadata travels with the existing drawing JSON. */
(function (W) {
  'use strict';
  var SC = W.SC, D = W.AccessDesign;
  if (!SC) return;
  var workspace = '../numeracy-hub/design/index.html';
  var supported = ['rectangle', 'square', 'circle', 'annulus', 'cylinder'];
  var pending = null, mode = 'send';
  var $ = function (id) { return W.document.getElementById(id); };

  function model() {
    if (!D) throw new Error('The design workspace could not load. Reload this page and try again.');
    return D;
  }

  function selectedProject() {
    var m = SC.M, ids = SC.S.sel;
    if (ids.length !== 1) throw new Error('Select one rectangle, square, circle, ring or cylinder to use its dimensions.');
    var o = m.obj(ids[0]);
    if (!o || o.type !== 'shape' || o.comp || supported.indexOf(o.shape) < 0) {
      throw new Error('This project supports a rectangle, square, circle, ring or cylinder. Select one of those shapes, or start in the design workspace.');
    }
    var validation = W.Shapes.validate(o.shape, o.params, o.ao);
    if (validation) throw new Error(validation.msg);
    var project = model().fromCanvas({ shapeId: o.shape, params: o.params, units: m.unit(), title: o.name || 'My design project' });
    if (o.designProject) {
      var original = model().validate(o.designProject);
      original.geometry = project.geometry;
      original.units = project.units;
      project = model().validate(original);
    }
    return project;
  }

  function importProject(raw) {
    // Validate every input before making any change to the student's drawing.
    var project = model().validate(raw), m = SC.M;
    var converted = model().toCanvas(project, m.unit());
    if (supported.indexOf(converted.shapeId) < 0) throw new Error('This project shape cannot be added to the canvas yet.');
    var validation = W.Shapes.validate(converted.shapeId, converted.params);
    if (validation) throw new Error(validation.msg);
    var before = m.snapshot(), selection = SC.S.sel.slice();
    try {
      var layer = m.doc.layers.filter(function (l) { return !l.hidden && !l.locked; })[0];
      if (!layer) {
        layer = { id: SC.U.uid('L'), name: 'Design project', hidden: false, locked: false };
        m.doc.layers.push(layer);
      }
      m.doc.activeLayer = layer.id;
      m.doc.pages.push({ id: SC.U.uid('p'), name: 'Design: ' + project.title, objs: [], links: [] });
      m.doc.page = m.doc.pages.length - 1;
      var o = m.addShape(converted.shapeId, 0, 0, converted.params);
      o.name = project.title;
      o.designProject = project;
      SC.S.sel = [o.id];
      SC.A.afterLoad();
      SC.I.commit();
      SC.P.toast('Design added on a new page. Undo removes the added page.');
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
    $('design-project-heading').textContent = 'Continue your design';
    $('design-project-workspace').hidden = false;
    $('design-project-primary').hidden = false;
    $('design-project-primary').textContent = 'Use selected shape';
    $('design-project-note').textContent = 'Your real dimensions and units carry over. Drawing position, rotation and scale stay on this canvas. The workspace guides you through the brief, dimensions, stock and CNC checks.';
    try {
      pending = selectedProject();
      var o = SC.M.obj(SC.S.sel[0]);
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
    $('design-project-heading').textContent = 'Bring your design onto the canvas';
    $('design-project-primary').textContent = 'Add as a new page';
    $('design-project-primary').hidden = false;
    $('design-project-workspace').hidden = true;
    $('design-project-note').textContent = 'The design will be added on a new page. Its real dimensions are converted to your drawing units. Your other pages stay here, and you can undo the addition.';
    try {
      pending = model().decode(W.location.hash.slice('#project='.length));
      pending = model().validate(pending);
      $('design-project-summary').textContent = pending.title + ' · ' + W.Shapes.info(pending.geometry.shapeId).name;
      $('design-project-primary').disabled = false;
    } catch (error) {
      $('design-project-summary').textContent = 'This design could not be opened: ' + error.message;
      $('design-project-primary').disabled = true;
    }
    showDialog();
  }

  function init() {
    $('btn-design-project').addEventListener('click', openSend);
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
          var link = workspace + '#project=' + model().encode(selectedProject());
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

  SC.DesignBridge = { selectedProject: selectedProject, importProject: importProject };
  if (W.document.readyState === 'loading') W.document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
