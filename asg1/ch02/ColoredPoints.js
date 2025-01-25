// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_BrushSize;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_BrushSize;
  }\n`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }\n`;

  
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const POLY = 3;

const SHORTCUTS = {
    'A': selectPointTool,
    'S': selectTriangleTool,
    'D': selectCircleTool,
    'F': selectPolyTool,
    'Shift+C': clearCanvas,
    'Ctrl+Z': undoAction,
    'Ctrl+Shift+Z': redoAction,
  };

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_BrushSize;

var g_selectedColor = [0.0, 0.0, 0.0, 1.0];
var g_selectedBrushSize = 10.0;
var g_selectedType = POINT;
var g_selectedSeg = 10;
var g_selectedPolyVerts = [];
var g_tempPolyPoints = []

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
    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < g_shapesList.length; i++) {
        g_shapesList[i].render();
    }
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

    if (!drawingPoly) {
        canvas.onmousemove = function (ev) {
            if (ev.buttons == 1) {
                handleClick(ev);
            }
        };
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
