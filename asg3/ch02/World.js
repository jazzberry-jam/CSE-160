// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform float u_BrushSize;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_BrushSize;
    v_UV = a_UV;
  }\n`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec2 v_UV;
  uniform sampler2D u_Sampler0;
  uniform int u_Select;
  void main() {
    if (u_Select == -2) {
      gl_FragColor = u_FragColor;
    }
      
    else if (u_Select == -1) {
      gl_FragColor = vec4(v_UV,1.0,1.0);
    }
      
    else if (u_Select == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
      
    else {
      gl_FragColor = vec4(1,.2,.2,1);
    }
  }\n`;

  
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const POLY = 3;

// const SHORTCUTS = {
//     'A': selectPointTool,
//     'S': selectTriangleTool,
//     'D': selectCircleTool,
//     'F': selectPolyTool,
//     'Shift+C': clearCanvas,
//     'Ctrl+Z': undoAction,
//     'Ctrl+Shift+Z': redoAction,
//   };

let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_BrushSize;
let u_GlobalRotateMatrix;
let u_ModelMatrix;
let u_Sampler;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Select;

var g_selectedColor = [0.0, 0.0, 0.0, 1.0];
var g_selectedBrushSize = 10.0;
var g_selectedType = POINT;
var g_selectedSeg = 10;
var g_selectedPolyVerts = [];
var g_tempPolyPoints = []
var g_globalAngleX = 320
var g_globalAngleY = 30
var g_appAngle = 0
var g_animationToggle = true

var g_shapesList = [];
var lastPos = [0, 0];
var drawingPoly = false;
var undoStack = []

// finalize polygon and add to the shape list
function finalizePolygon() {
    let shape = new Poly();
    shape.vertices = g_selectedPolyVerts.slice();
    shape.color = g_selectedColor.slice();
    shape.segments = g_selectedSeg;

    g_tempPolyPoints = []
    g_shapesList.push(shape);
    g_selectedPolyVerts = [];
    drawingPoly = false;

    setText("Polygon", "selectpoly");
    renderAllShapes();
}

// render all shapes on the canvas
function renderAllShapes() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // for (var i = 0; i < g_shapesList.length; i++) {
    //     g_shapesList[i].render();
    // }
    
    var globalRatMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0)
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRatMat.elements)
    
    var projMat = new Matrix4()
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements)
    
    var viewMat = new Matrix4()
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements)
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // // Draw the body cube 
    // var body = new Cube(); 
    // body.color = [1.0,0.0,0.0,1.0]; 
    // body.matrix.scale(.5, .3, .5);
    // var bodyMat = new Matrix4(body.matrix)
    // body.matrix.translate(-.25, -.75, 0.0); 
    // body.render();
    
    // // Draw a left arm 
    // var leftArm = new Cube(); 
    // leftArm.color = [1,1,0,1]; 
    // leftArm.matrix = bodyMat
    // leftArm.matrix.rotate(g_appAngle, 0,0,1);
    // leftArm.matrix.translate(0,0.25,0,0); 
    // var appMat = new Matrix4(leftArm.matrix)
    // // leftArm.matrix.scale(0.25, .7, .5);
    // leftArm.render()
    
    // // Test box
    // var box = new Cube(); 
    // box.color = [1,0,1,1];
    // box.matrix = appMat
    // box.matrix.translate(0,1,0,0); 
    // box.matrix.rotate(Math.sin(g_seconds*10)*30,1,0,0); 
    // // box.matrix.scale(.5,.5,.5);
    // box.render();
    
    
    var body1 = new Cube();
    body1.textureSelect = 0; 
    body1.color = [1.0,0.0,0.0,1.0];
    body1.matrix.scale(.4,.4,.4,1)
    body1.matrix.translate(-1,-1,0,1)
    body1.render()
    
    var body2 = new Cube(); 
    body2.color = [0.0,0.0,1.0,1.0];
    body2.matrix = new Matrix4(body1.matrix)
    body2.matrix.scale(1.6,1.4,1.5,1)
    body2.matrix.translate(0.6,-0.1,-.2,1)
    body2.render()
    
    var head = new Cube(); 
    head.color = [0.0,1.0,0.0,1.0];
    head.matrix = new Matrix4(body1.matrix)
    head.matrix.scale(1.2,1.2,1.2,1)
    head.matrix.translate(-1,-.1,-.1,1)
    head.render()
    
    var arm1 = new Cube()
    arm1.color = [0,1.0,1.0,1.0];
    arm1.matrix = new Matrix4(body1.matrix)
    arm1.matrix.rotate(Math.sin((g_seconds*10)+1)*10,1,0,0)
    arm1.matrix.translate(.9,.5,1,1)
    arm1.matrix.rotate(30, 1, 0, 0)
    arm1.matrix.rotate(-30, 0, 0, 1)
    arm1.matrix.rotate(-75, 0, 1, 0)
    arm1.matrix.scale(2,.3,.3,1)
    arm1.render()
    
    var arm2 = new Cube()
    arm2.color = [1.0,1.0,0,1.0];
    arm2.matrix = new Matrix4(body1.matrix)
    arm2.matrix.rotate(Math.sin((g_seconds*10)+9)*10,1,0,0)
    arm2.matrix.translate(0.7,.5,1,1)
    arm2.matrix.rotate(30, 1, 0, 0)
    arm2.matrix.rotate(-15, 0, 0, 1)
    arm2.matrix.rotate(-90, 0, 1, 0)
    arm2.matrix.scale(2,.3,.3,1)
    arm2.render()
    
    var arm3 = new Cube()
    arm3.color = [1.0,0.0,1.0,1.0];
    arm3.matrix = new Matrix4(body1.matrix)
    arm3.matrix.rotate(Math.sin((g_seconds*10)+2)*10,1,0,0)
    arm3.matrix.translate(0.5,.5,1,1)
    arm3.matrix.rotate(30, 1, 0, 0)
    arm3.matrix.rotate(15, 0, 0, 1)
    arm3.matrix.rotate(-105, 0, 1, 0)
    arm3.matrix.scale(2,.3,.3,1)
    arm3.render()
    
    var arm4 = new Cube()
    arm4.color = [0,1.0,1.0,1.0];
    arm4.matrix = new Matrix4(body1.matrix)
    arm4.matrix.rotate(Math.sin((g_seconds*10)+8)*10,1,0,0)
    arm4.matrix.translate(1.1,0,1,1)
    arm4.matrix.rotate(180, 0, 1, 0)
    arm4.matrix.translate(.9,.5,1,1)
    arm4.matrix.rotate(30, 1, 0, 0)
    arm4.matrix.rotate(-30, 0, 0, 1)
    arm4.matrix.rotate(-75, 0, 1, 0)
    arm4.matrix.scale(2,.3,.3,1)
    arm4.render()
    
    var arm5 = new Cube()
    arm5.color = [1.0,1.0,0,1.0];
    arm5.matrix = new Matrix4(body1.matrix)
    arm5.matrix.rotate(Math.sin((g_seconds*10)+3)*10,1,0,0)
    arm5.matrix.translate(1.1,0,1,1)
    arm5.matrix.rotate(180, 0, 1, 0)
    arm5.matrix.translate(0.7,.5,1,1)
    arm5.matrix.rotate(30, 1, 0, 0)
    arm5.matrix.rotate(-15, 0, 0, 1)
    arm5.matrix.rotate(-90, 0, 1, 0)
    arm5.matrix.scale(2,.3,.3,1)
    arm5.render()
    
    var arm6 = new Cube()
    arm6.color = [1.0,0.0,1.0,1.0];
    arm6.matrix = new Matrix4(body1.matrix)
    arm6.matrix.rotate(Math.sin((g_seconds*10)+6)*10,1,0,0)
    arm6.matrix.translate(1.1,0,1,1)
    arm6.matrix.rotate(180, 0, 1, 0)
    arm6.matrix.translate(0.5,.5,1,1)
    arm6.matrix.rotate(30, 1, 0, 0)
    arm6.matrix.rotate(15, 0, 0, 1)
    arm6.matrix.rotate(-105, 0, 1, 0)
    arm6.matrix.scale(2,.3,.3,1)
    arm6.render()
}

function main() {
    // util
    setupWebGL();
    connectToGLSL();
    
    // input
    handleInput();

    canvas.onmousedown = function (ev) {
        handleClick(ev);
    };

    // if (!drawingPoly) {
    //     canvas.onmousemove = function (ev) {
    //         if (ev.buttons == 1) {
    //             handleClick(ev);
    //         }
    //     };
    // }
    
    initTextures()

    gl.clearColor(1.0, 1.0, 1.0, 0.0);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    // renderAllShapes()
    if (g_animationToggle) {
      requestAnimationFrame(tick)
    }
}

var g_startTime = performance.now()/1000.0
var g_seconds = performance.now()/1000.0 - g_startTime

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime
  renderAllShapes()
  
  if (g_animationToggle) {
    requestAnimationFrame(tick)
  }
}
