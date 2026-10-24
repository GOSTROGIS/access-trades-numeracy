
%
O00066 (Ballbar150mm 1270mm per min) 

(Quick check: XY 360deg 150mm Calibrated) 
(XY, 360 degree test, 150 mm radius, 1270 mm/min feed rate) 
(Work offset must be defined where the centre mount is positioned) 

N10 G21 (input in mm) 

N20 G54 (set origin position) 

N30 G90 (absolute dimensions) 

N40 G17 (XY plane) 

N50 G64 (disable stopping between moves) 

N60 G94 F1270. (feed rate in mm/min) 

N70 G01 X-151.5 Y0. Z0. (move to start point) 

N80 M00 (stop to load ball bar) 

N90 G01 X-150. Y0. (in feed) 

N100 G03 X-150. Y0. I150. J0. (CCW arc) 

N110 G03 X-150. Y0. I150. J0. (CCW arc) 

N120 G01 X-151.5 Y0. (out feed) 

N130 G04 P5. (pause between runs) 

N140 G01 X-150. Y0. (in feed) 

N150 G02 X-150. Y0. I150. J0. (CW arc) 

N160 G02 X-150. Y0. I150. J0. (CW arc) 

N170 G01 X-151.5 Y0. (out feed) 

N180 M30 (end of program) 
%
