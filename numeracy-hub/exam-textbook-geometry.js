/* Textbook chapters 9–13. Every answer is calculated from the generated givens.
   Kept separate so the chapter bank and its numerical checks share these factories. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.TextbookGeometry = factory;
})(typeof window !== 'undefined' ? window : globalThis, function (H) {
  'use strict';
  var add = H.add, ri = H.ri, pick = H.pick, n = H.n, q = H.q;
  var PI = Math.PI, D = PI / 180;
  function rounded(text, dp) { return text + ' Round to ' + dp + ' decimal places.'; }
  function fig(id, p, unit) { return H.shape(id, p, unit); }

  add(9, 'room-trim', 'Baseboard and openings', 2, function (r) {
    var l = ri(r, 35, 80) / 10, w = ri(r, 25, 55) / 10, door = pick(r, [0.8, 0.9, 1.2]);
    var p = 2 * (l + w), answer = p - door;
    return q(rounded('A rectangular room is ' + n(l) + ' m by ' + n(w) + ' m. Install baseboard along every wall except one ' + n(door) + ' m doorway. What baseboard length is needed before waste?', 2), answer, 'm', 2,
      ['Full perimeter = 2 × (length + width) = 2 × (' + n(l) + ' + ' + n(w) + ') = ' + n(p) + ' m.',
       'Subtract the doorway once: ' + n(p) + ' − ' + n(door) + ' = ' + n(answer, 2) + ' m.'],
      {label: 'Baseboard length', expr: '2 × ( ' + l + ' + ' + w + ' ) − ' + door, fig: fig('rectangle', {l:l,w:w}, 'm')});
  });
  add(9, 'wall-plates', 'Three courses of wall plate', 2, function (r) {
    var l = ri(r, 7, 16), w = ri(r, 5, 11), answer = 6 * (l + w);
    return q('A rectangular wall layout measures ' + l + ' m by ' + w + ' m. Estimate one bottom plate and two top plates around the full perimeter. Ignore joints and openings. What total plate length is needed?', answer, 'm', 0,
      ['One course = 2 × (' + l + ' + ' + w + ') = ' + (2 * (l + w)) + ' m.',
       'There are 1 + 2 = 3 courses. Total = ' + (2 * (l + w)) + ' × 3 = ' + answer + ' m.'],
      {label:'Plate length',expr:'2 × ( ' + l + ' + ' + w + ' ) × 3',fig:fig('rectangle',{l:l,w:w},'m')});
  });
  add(9, 'round-edging', 'Circumference of a round form', 1, function (r) {
    var d = ri(r, 10, 60) / 10, answer = PI * d;
    return q(rounded('A circular form has a diameter of ' + n(d) + ' m. What is the length of edging for one complete circuit? Use the calculator π key.', 2), answer, 'm', 2,
      ['Circumference = π × diameter.', 'C = π × ' + n(d) + ' = ' + n(answer, 5) + ' m; round only at the end: ' + n(answer, 2) + ' m.'],
      {label:'Circumference',expr:'π × ' + d,fig:fig('circle',{r:d/2},'m')});
  });
  add(9, 'arc-trim', 'Curved trim length', 2, function (r) {
    var radius = ri(r, 3, 12) / 2, angle = pick(r, [45,60,90,120,135,150]), answer = angle / 360 * 2 * PI * radius;
    return q(rounded('A curved trim follows an arc with radius ' + n(radius) + ' m and central angle ' + angle + '°. Find only the curved length, excluding the two straight radii. Use the calculator π key.', 2), answer, 'm', 2,
      ['Diameter = 2 × radius = 2 × ' + n(radius) + ' = ' + n(2 * radius) + ' m. A full circle measures π × diameter.',
       'Arc = ' + angle + ' ÷ 360 × π × ' + n(2 * radius) + ' = ' + n(answer, 5) + ' m.',
       'Rounded curved length = ' + n(answer, 2) + ' m.'],
      {label:'Arc length',expr:angle + ' ÷ 360 × π × ' + (2 * radius),fig:fig('sector',{r:radius,t:angle},'m')});
  });
  add(9, 'arched-panel', 'Rectangle with a semicircular top', 3, function (r) {
    var width = ri(r, 6, 20) / 10, side = ri(r, 10, 25) / 10, curve = PI * width / 2, answer = width + 2 * side + curve;
    return q(rounded('A panel has a straight bottom ' + n(width) + ' m wide, two vertical sides each ' + n(side) + ' m high, and a semicircular top whose diameter equals the width. Find the outside perimeter. The diameter beneath the semicircle is inside the panel, not an outside edge.', 2), answer, 'm', 2,
      ['Semicircle arc = π × diameter ÷ 2 = π × ' + n(width) + ' ÷ 2 = ' + n(curve, 5) + ' m.',
       'Outside perimeter = bottom + two sides + curved top = ' + n(width) + ' + 2 × ' + n(side) + ' + ' + n(curve, 5) + '.',
       'Keep full precision for the arc. Final perimeter = ' + n(answer, 2) + ' m.'],
      {label:'Outside perimeter',expr:width + ' + 2 × ' + side + ' + π × ' + width + ' ÷ 2'});
  });
  add(9, 'circle-diameter', 'Diameter from circumference', 2, function (r) {
    var c = ri(r, 150, 950) / 100, answer = c / PI;
    return q(rounded('A flexible tape measures ' + n(c, 2) + ' m around a circular form. What is its diameter? Use the calculator π key.', 2), answer, 'm', 2,
      ['C = πd. Divide both sides by π: d = C ÷ π.', 'd = ' + n(c, 2) + ' ÷ π = ' + n(answer, 5) + ' m ≈ ' + n(answer, 2) + ' m.'],
      {label:'Diameter',expr:c + ' ÷ π'});
  });

  add(10, 'wall-area', 'Wall sheathing minus openings', 2, function (r) {
    var l = ri(r, 5, 12), h = pick(r,[2.4,2.7,3]), dw = pick(r,[0.8,0.9,1]), dh = 2.1, ww = pick(r,[1.2,1.5,1.8]), wh = 1.2;
    var gross=l*h, opening=dw*dh+ww*wh, answer=gross-opening;
    return q(rounded('A wall is ' + l + ' m long and ' + n(h) + ' m high. It has one doorway ' + n(dw) + ' m × ' + dh + ' m and one window ' + n(ww) + ' m × ' + wh + ' m. Find the net sheathing area; exclude both openings and allow no waste.',2),answer,'m²',2,
      ['Gross wall area = ' + l + ' × ' + n(h) + ' = ' + n(gross) + ' m².',
       'Openings = ' + n(dw) + ' × ' + dh + ' + ' + n(ww) + ' × ' + wh + ' = ' + n(opening) + ' m².',
       'Net area = ' + n(gross) + ' − ' + n(opening) + ' = ' + n(answer,2) + ' m².'],
      {label:'Net area',expr:l+' × '+h+' − '+dw+' × '+dh+' − '+ww+' × '+wh});
  });
  add(10, 'gable-area', 'Triangular gable area', 1, function (r) {
    var b=ri(r,40,120)/10,h=ri(r,10,40)/10, answer=b*h/2;
    return q(rounded('A triangular gable has a base ' + n(b) + ' m wide and a perpendicular height of ' + n(h) + ' m. Find its area before allowing for waste.',2),answer,'m²',2,
      ['Triangle area = base × perpendicular height ÷ 2.', 'A = '+n(b)+' × '+n(h)+' ÷ 2 = '+n(answer,2)+' m².'],
      {label:'Gable area',expr:b+' × '+h+' ÷ 2',fig:fig('isosceles-triangle',{b:b,h:h},'m')});
  });
  add(10, 'trapezoid-area', 'Trapezoid deck area', 2, function (r) {
    var a=ri(r,3,6),b=a+ri(r,2,5),h=ri(r,20,55)/10, answer=(a+b)*h/2;
    return q(rounded('A trapezoid deck has parallel sides of '+a+' m and '+b+' m, separated by a perpendicular distance of '+n(h)+' m. Find its plan area.',2),answer,'m²',2,
      ['Average the two parallel sides: ('+a+' + '+b+') ÷ 2 = '+n((a+b)/2)+' m.',
       'Area = average parallel side × perpendicular height = '+n((a+b)/2)+' × '+n(h)+' = '+n(answer,2)+' m².'],
      {label:'Deck area',expr:'( '+a+' + '+b+' ) × '+h+' ÷ 2',fig:fig('trapezoid',{a:a,b:b,h:h},'m')});
  });
  add(10, 'ring-area', 'Circular opening in a round panel', 2, function (r) {
    var outer=ri(r,6,15)/10, inner=ri(r,1,4)/10, answer=PI*(outer*outer-inner*inner);
    return q(rounded('A round panel has an outside radius of '+n(outer)+' m and a circular opening with radius '+n(inner)+' m. Find the material area remaining. Use the calculator π key.',2),answer,'m²',2,
      ['Remaining area = outside circle − opening = πR² − πr².',
       'A = π × ('+n(outer)+'² − '+n(inner)+'²) = '+n(answer,5)+' m² ≈ '+n(answer,2)+' m².'],
      {label:'Remaining area',expr:'π × ( '+outer+'² − '+inner+'² )',fig:fig('annulus',{R:outer,r:inner},'m')});
  });
  add(10, 'sheet-takeoff', 'Sheet count with waste', 3, function (r) {
    var area=ri(r,40,130), waste=pick(r,[5,8,10,12,15]), sheet=2.88, gross=area*(1+waste/100), answer=Math.ceil(area*(100+waste)/288);
    return q('A takeoff requires '+area+' m² of sheathing. Add '+waste+'% of the net area for waste. Each sheet covers 1.2 m × 2.4 m = 2.88 m². Using an area-only estimate, how many whole sheets must you order? Round the sheet count up.',answer,'sheets',0,
      ['Area including waste = '+area+' × (1 + '+waste+' ÷ 100) = '+n(gross,2)+' m².',
       'Sheet equivalents = '+n(gross,2)+' ÷ 2.88 = '+n(gross/sheet,5)+'.',
       'A partial sheet requires a whole purchased sheet, so round up to '+answer+' sheets.'],
      {label:'Whole sheets'});
  });
  add(10, 'box-surface', 'All six faces of a box', 2, function (r) {
    var l=ri(r,6,18)/10,w=ri(r,4,10)/10,h=ri(r,3,9)/10, answer=2*(l*w+l*h+w*h);
    return q(rounded('A closed rectangular storage box has outside dimensions '+n(l)+' m × '+n(w)+' m × '+n(h)+' m. Find the total outside surface area of all six faces. Ignore edge thickness and overlaps.',2),answer,'m²',2,
      ['There are three pairs of equal faces. SA = 2(lw + lh + wh).',
       'SA = 2 × ('+n(l)+' × '+n(w)+' + '+n(l)+' × '+n(h)+' + '+n(w)+' × '+n(h)+') = '+n(answer,2)+' m².'],
      {label:'Surface area',expr:'2 × ( '+l+' × '+w+' + '+l+' × '+h+' + '+w+' × '+h+' )',fig:fig('rectangular-prism',{l:l,w:w,h:h},'m')});
  });

  add(11, 'slab-concrete', 'Concrete slab with allowance', 3, function (r) {
    var l=ri(r,4,12),w=ri(r,3,8),depth=pick(r,[100,125,150]),waste=pick(r,[5,8,10]), v=l*w*depth/1000,answer=v*(1+waste/100);
    return q(rounded('A slab is '+l+' m long, '+w+' m wide and '+depth+' mm thick. What concrete volume should be allowed when '+waste+'% is added to the calculated volume? Report the calculated allowance, without rounding to a supplier batch size.',2),answer,'m³',2,
      ['Convert thickness: '+depth+' mm ÷ 1000 = '+n(depth/1000)+' m.',
       'Net volume = '+l+' × '+w+' × '+n(depth/1000)+' = '+n(v)+' m³.',
       'With allowance = '+n(v)+' × (1 + '+waste+' ÷ 100) = '+n(answer,2)+' m³.'],
      {label:'Concrete with allowance',expr:l+' × '+w+' × '+depth+' ÷ 1000 × ( 1 + '+waste+' ÷ 100 )',fig:fig('rectangular-prism',{l:l,w:w,h:depth/1000},'m')});
  });
  add(11, 'pier-concrete', 'Cylindrical concrete piers', 2, function (r) {
    var count=ri(r,3,10),d=pick(r,[250,300,350,400]),h=ri(r,8,18)/10,radius=d/2000,one=PI*radius*radius*h,answer=one*count;
    return q(rounded('Pour '+count+' identical cylindrical concrete piers. Each has diameter '+d+' mm and height '+n(h)+' m. Find their combined volume in cubic metres, with no waste allowance. Use the calculator π key.',3),answer,'m³',3,
      ['Radius = diameter ÷ 2 = '+d+' ÷ 2 = '+(d/2)+' mm = '+n(radius)+' m.',
       'One pier: V = πr²h = π × '+n(radius)+'² × '+n(h)+' = '+n(one,6)+' m³.',
       'All piers = '+count+' × the unrounded volume of one pier = '+n(answer,3)+' m³.'],
      {label:'Total concrete volume',expr:count+' × π × '+radius+'² × '+h,fig:fig('cylinder',{r:radius,h:h},'m')});
  });
  add(11, 'wedge-ramp', 'Solid triangular ramp volume', 2, function (r) {
    var run=ri(r,12,40)/10,rise=ri(r,2,8)/10,width=ri(r,10,24)/10,area=run*rise/2,answer=area*width;
    return q(rounded('A solid ramp is a triangular prism. Its side profile has a horizontal run of '+n(run)+' m and a perpendicular rise of '+n(rise)+' m. It is '+n(width)+' m wide. Find its volume.',3),answer,'m³',3,
      ['Triangular end area = run × rise ÷ 2 = '+n(run)+' × '+n(rise)+' ÷ 2 = '+n(area)+' m².',
       'Prism volume = end area × width = '+n(area)+' × '+n(width)+' = '+n(answer,3)+' m³.'],
      {label:'Ramp volume',expr:run+' × '+rise+' ÷ 2 × '+width,fig:fig('right-triangle-prism',{b:run,h:rise,l:width},'m')});
  });
  add(11, 'board-feet', 'Lumber tally in board feet', 2, function (r) {
    var count=ri(r,8,32),thick=pick(r,[1,2]),width=pick(r,[4,6,8,10,12]),length=pick(r,[8,10,12,14,16]),one=thick*width*length/12,answer=count*one;
    return q(rounded('A lumber tally uses nominal dimensions: '+count+' boards, each '+thick+' in thick × '+width+' in wide × '+length+' ft long. Find the total board feet. Use BF = thickness(in) × width(in) × length(ft) ÷ 12; do not substitute dressed dimensions.',2),answer,'board ft',2,
      ['One board = '+thick+' × '+width+' × '+length+' ÷ 12 = '+n(one,5)+' board ft.',
       'Total = '+count+' × the unrounded board feet per board = '+n(answer,2)+' board ft.'],
      {label:'Total board feet',expr:count+' × '+thick+' × '+width+' × '+length+' ÷ 12'});
  });
  add(11, 'tank-litres', 'Tank capacity in litres', 1, function (r) {
    var l=ri(r,60,150),w=ri(r,30,80),h=ri(r,30,90),answer=l*w*h/1000;
    return q(rounded('A rectangular tank has inside dimensions '+l+' cm long, '+w+' cm wide and '+h+' cm deep. Find its capacity when filled to the top. Use 1 L = 1000 cm³.',2),answer,'L',2,
      ['Inside volume = '+l+' × '+w+' × '+h+' = '+n(l*w*h)+' cm³.',
       'Capacity = '+n(l*w*h)+' ÷ 1000 = '+n(answer,2)+' L.'],
      {label:'Capacity',expr:l+' × '+w+' × '+h+' ÷ 1000',fig:fig('rectangular-prism',{l:l,w:w,h:h},'cm')});
  });
  add(11, 'pyramid-form', 'Square pyramid volume', 2, function (r) {
    var side=ri(r,6,20)/10,height=ri(r,5,18)/10,area=side*side,answer=area*height/3;
    return q(rounded('A solid square pyramid has a base side of '+n(side)+' m and a perpendicular height of '+n(height)+' m. Find its volume. The height is measured vertically from the base, not along a sloping edge.',3),answer,'m³',3,
      ['Base area = '+n(side)+'² = '+n(area)+' m².',
       'Pyramid volume = base area × perpendicular height ÷ 3 = '+n(area)+' × '+n(height)+' ÷ 3 = '+n(answer,3)+' m³.'],
      {label:'Pyramid volume',expr:side+'² × '+height+' ÷ 3'});
  });

  add(12, 'triangle-angle', 'Missing angle in a triangle', 1, function (r) {
    var a=ri(r,25,70),b=ri(r,25,70),answer=180-a-b;
    return q('Two interior angles of a triangular brace are '+a+'° and '+b+'°. What is the third interior angle?',answer,'°',0,
      ['The interior angles of any triangle sum to 180°.', 'Missing angle = 180 − '+a+' − '+b+' = '+answer+'°.'],
      {label:'Third angle',expr:'180 − '+a+' − '+b});
  });
  add(12, 'panel-diagonal', 'Rectangle diagonal', 2, function (r) {
    var l=ri(r,15,50)/10,w=ri(r,10,30)/10,answer=Math.hypot(l,w);
    return q(rounded('A rectangular panel is '+n(l)+' m long and '+n(w)+' m wide. What diagonal measurement should a corner-to-corner check produce?',3),answer,'m',3,
      ['The diagonal is the hypotenuse of a right triangle: d² = l² + w².',
       'd = √('+n(l)+'² + '+n(w)+'²) = √('+n(l*l+w*w)+') = '+n(answer,6)+' m.',
       'Rounded diagonal = '+n(answer,3)+' m.'],
      {label:'Diagonal',expr:'√( '+l+'² + '+w+'² )',fig:fig('rectangle',{l:l,w:w},'m')});
  });
  add(12, 'missing-run', 'Find a right-triangle leg', 2, function (r) {
    var slope=ri(r,30,65)/10,rise=ri(r,5,20)/10,answer=Math.sqrt(slope*slope-rise*rise);
    return q(rounded('A straight brace is '+n(slope)+' m long and reaches a point '+n(rise)+' m vertically above its lower end. Find the horizontal distance between its ends. Treat the vertical and horizontal distances as perpendicular.',3),answer,'m',3,
      ['The brace is the hypotenuse. Horizontal run² = brace² − rise².',
       'Run = √('+n(slope)+'² − '+n(rise)+'²) = √('+n(slope*slope-rise*rise)+') = '+n(answer,3)+' m.'],
      {label:'Horizontal run',expr:'√( '+slope+'² − '+rise+'² )'});
  });
  add(12, 'square-check', 'Scaled 3-4-5 layout', 1, function (r) {
    var scale=ri(r,2,9)*100,a=3*scale,b=4*scale,answer=5*scale;
    return q('For a squaring check, marks are placed '+a+' mm and '+b+' mm from the same corner along two layout lines. What distance between the marks confirms a right angle?',answer,'mm',0,
      ['The distances are 3 × '+scale+' and 4 × '+scale+' mm, a scaled 3-4-5 triangle.',
       'The checking diagonal must be 5 × '+scale+' = '+answer+' mm.',
       'Check: '+a+'² + '+b+'² = '+answer+'².'],
      {label:'Checking diagonal',expr:'5 × '+scale,fig:fig('right-triangle',{b:a,h:b},'mm')});
  });
  add(12, 'decimal-degrees', 'Degrees and minutes', 2, function (r) {
    var deg=ri(r,12,78),minutes=pick(r,[6,12,18,24,30,36,42,48,54]),answer=deg+minutes/60;
    return q(rounded('A layout drawing gives an angle of '+deg+'° '+minutes+'′. Express the angle in decimal degrees. There are 60 minutes in one degree.',2),answer,'°',2,
      ['Convert only the minutes: '+minutes+' ÷ 60 = '+n(minutes/60)+'°.',
       'Add the whole degrees: '+deg+' + '+n(minutes/60)+' = '+n(answer,2)+'°.'],
      {label:'Decimal angle',expr:deg+' + '+minutes+' ÷ 60'});
  });
  add(12, 'stair-stringer', 'Stair stringer pitch line', 3, function (r) {
    var risers=ri(r,10,17),rise=ri(r,165,190),going=ri(r,250,285),treads=risers-1,totalRise=risers*rise,totalRun=treads*going,answer=Math.hypot(totalRise,totalRun);
    return q(rounded('A stair layout has '+risers+' equal rises of '+rise+' mm and '+treads+' equal horizontal goings of '+going+' mm. Find the straight pitch-line distance spanning the stated total rise and total run. Exclude end allowances and landings.',2),answer,'mm',2,
      ['Total rise = '+risers+' × '+rise+' = '+totalRise+' mm. Total run = '+treads+' × '+going+' = '+totalRun+' mm.',
       'Pitch line = √(total rise² + total run²) = √('+totalRise+'² + '+totalRun+'²).',
       'Keep full calculator precision; pitch-line length = '+n(answer,2)+' mm.'],
      {label:'Pitch-line length',expr:'√( '+totalRise+'² + '+totalRun+'² )',fig:fig('right-triangle',{b:totalRun,h:totalRise},'mm')});
  });

  add(13, 'rafter-rise', 'Roof rise from pitch angle', 2, function (r) {
    var run=ri(r,20,60)/10,angle=ri(r,18,42),answer=run*Math.tan(angle*D);
    return q(rounded('A roof has a horizontal run of '+n(run)+' m from wall to ridge and a pitch angle of '+angle+'° above horizontal. Find the vertical rise. Set the calculator to DEG mode.',3),answer,'m',3,
      ['Relative to the pitch angle, rise is opposite and run is adjacent: tan θ = rise ÷ run.',
       'Rise = run × tan θ = '+n(run)+' × tan('+angle+'°) = '+n(answer,6)+' m.',
       'Rounded rise = '+n(answer,3)+' m.'],
      {label:'Rise',expr:run+' × tan '+angle+'°'});
  });
  add(13, 'rafter-length', 'Rafter length from run and angle', 2, function (r) {
    var run=ri(r,25,65)/10,angle=ri(r,20,45),answer=run/Math.cos(angle*D);
    return q(rounded('A rafter makes an angle of '+angle+'° above horizontal. The horizontal run from its wall reference point to the ridge reference point is '+n(run)+' m. Find the sloping length between those points, excluding overhang and connection allowances. Use DEG mode.',3),answer,'m',3,
      ['Run is adjacent; rafter is the hypotenuse. cos θ = run ÷ rafter.',
       'Rafter = run ÷ cos θ = '+n(run)+' ÷ cos('+angle+'°) = '+n(answer,3)+' m.'],
      {label:'Sloping length',expr:run+' ÷ cos '+angle+'°'});
  });
  add(13, 'ramp-angle', 'Slope angle from rise and run', 2, function (r) {
    var rise=ri(r,15,60)/100,run=ri(r,20,80)/10,answer=Math.atan(rise/run)/D;
    return q(rounded('A ramp layout rises '+n(rise)+' m over a horizontal run of '+n(run)+' m. Find its angle above horizontal. Use DEG mode.',2),answer,'°',2,
      ['tan θ = opposite ÷ adjacent = rise ÷ run = '+n(rise)+' ÷ '+n(run)+'.',
       'Apply inverse tangent: θ = tan⁻¹('+n(rise/run,6)+') = '+n(answer,2)+'°; use the unrounded ratio.'],
      {label:'Slope angle',seq:rise+' ÷ '+run+' = TAN⁻¹',fig:fig('right-triangle',{b:run,h:rise},'m')});
  });
  add(13, 'brace-height', 'Vertical height from sine', 2, function (r) {
    var length=ri(r,15,45)/10,angle=ri(r,30,70),answer=length*Math.sin(angle*D);
    return q(rounded('A brace of length '+n(length)+' m is inclined at '+angle+'° above horizontal. What is the vertical difference between its ends? Use DEG mode.',3),answer,'m',3,
      ['The vertical difference is opposite the given angle, and the brace is the hypotenuse.',
       'sin θ = height ÷ length, so height = '+n(length)+' × sin('+angle+'°) = '+n(answer,3)+' m.'],
      {label:'Vertical difference',expr:length+' × sin '+angle+'°'});
  });
  add(13, 'pitch-ratio', 'Roof angle from rise per run', 2, function (r) {
    var rise=ri(r,3,10),answer=Math.atan(rise/12)/D;
    return q(rounded('A roof rises '+rise+' in for every 12 in of horizontal run. What angle does its pitch line make with horizontal? Use DEG mode.',2),answer,'°',2,
      ['The rise-to-run ratio is '+rise+'/12. Equal units cancel.',
       'tan θ = '+rise+' ÷ 12, so θ = tan⁻¹('+rise+' ÷ 12) = '+n(answer,2)+'°.'],
      {label:'Pitch angle',seq:rise+' ÷ 12 = TAN⁻¹',fig:fig('right-triangle',{b:12,h:rise},'in')});
  });
  add(13, 'offset-travel', 'Diagonal travel across an offset', 3, function (r) {
    var offset=ri(r,200,900),angle=pick(r,[22.5,30,45,60]),answer=offset/Math.sin(angle*D);
    return q(rounded('A diagonal brace must cross a perpendicular offset of '+offset+' mm. It makes an angle of '+angle+'° with the original straight reference line. Find its straight centre-line travel between the two parallel reference lines. Ignore end allowances. Use DEG mode.',2),answer,'mm',2,
      ['The offset is opposite the angle; the diagonal travel is the hypotenuse.',
       'sin θ = offset ÷ travel, so travel = offset ÷ sin θ.',
       'Travel = '+offset+' ÷ sin('+angle+'°) = '+n(answer,2)+' mm.'],
      {label:'Diagonal travel',expr:offset+' ÷ sin '+angle+'°'});
  });
});
