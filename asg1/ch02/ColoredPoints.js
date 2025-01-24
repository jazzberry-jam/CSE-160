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

const shortcuts = {
    'W': selectPointTool,
    'A': selectTriangleTool,
    'S': selectCircleTool,
    'D': selectPolyTool,
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
var printPos = [0, 0];
var drawingPoly = false;
var undoStack = []

function handleKeyDown(ev) {
    const key = ev.key; // get the key pressed
    const modifier = 
        (ev.ctrlKey || ev.metaKey) && ev.shiftKey ? 'Ctrl+Shift+' : (ev.shiftKey ? 'Shift+' : (ev.ctrlKey || ev.metaKey) ? 'Ctrl+' : '');
        
    // combine modifier (if any) and key to create a shortcut string
    const shortcut = `${modifier}${key.toUpperCase()}`;
    console.log(shortcut)
  
    // check if the shortcut exists in the mapping
    if (shortcuts[shortcut]) {
        ev.preventDefault();
        shortcuts[shortcut](); 
    }
}

// handle input changes and tool selection
function handleInput() {
    document.addEventListener("keydown", handleKeyDown);
    
    // actions
    document.getElementById("clearbutton").addEventListener("mouseup", clearCanvas);
    document.getElementById("undobutton").addEventListener("mouseup", undoAction);
    document.getElementById("redobutton").addEventListener("mouseup", redoAction);

    // color
    document.getElementById("redslide").addEventListener("mouseup", function () {
        g_selectedColor[0] = this.value / 100;
        updateColorIndicator();
    });
    document.getElementById("greenslide").addEventListener("mouseup", function () {
        g_selectedColor[1] = this.value / 100;
        updateColorIndicator();
    });
    document.getElementById("blueslide").addEventListener("mouseup", function () {
        g_selectedColor[2] = this.value / 100;
        updateColorIndicator();
    });
    
    // brush properties
    document.getElementById("segslide").addEventListener("mouseup", function () {
        g_selectedSeg = this.value;
    });
    document.getElementById("brushsizeslide").addEventListener("mouseup", function () {
        g_selectedBrushSize = this.value;
        updateColorIndicator();
    });

    // shapes
    document.getElementById("selectpoint").onclick = selectPointTool;
    document.getElementById("selecttriangle").onclick = selectTriangleTool;
    document.getElementById("selectcircle").onclick = selectCircleTool;
    document.getElementById("selectpoly").onclick = selectPolyTool;
    
    // example
    document.getElementById("showexample").onclick = showExample;
}

function updateColorIndicator() {
    const colorIndicator = document.getElementById("indicator");
    colorIndicator.style.backgroundColor = `rgb(${Math.floor(g_selectedColor[0] * 255)}, ${Math.floor(g_selectedColor[1] * 255)}, ${Math.floor(g_selectedColor[2] * 255)})`;
    colorIndicator.style.width = `${g_selectedBrushSize}px`
    colorIndicator.style.height = `${g_selectedBrushSize}px`
}

// handle polygon-specific input and rendering
function handlePolygonTool(ev) {
    const coord = coordConvert(ev);
    if (coord.length === 2) {
        g_selectedPolyVerts.push(coord);
        let point = new Point();
        point.position = coord
        point.color = [1.0, 0.0, 0.0, 1.0].slice();
        point.brushSize = 10;
        g_tempPolyPoints.push(point)
        
        for (let i = 0; i < g_tempPolyPoints.length; i++) {
            g_tempPolyPoints[i].render()
        }
    }

    if (g_selectedPolyVerts.length >= 3 && !drawingPoly) {
        finalizePolygon();
    }
}

// Finalize polygon and add to the shape list
function finalizePolygon() {
    const shape = new Poly();
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

// Handle clicks and shape creation
function click(ev) {
    if (g_selectedType === POLY) {
        handlePolygonTool(ev);
        return;
    }

    let shape;
    if (g_selectedType === POINT) {
        shape = new Point();
    } else if (g_selectedType === TRIANGLE) {
        shape = new Triangle();
    } else if (g_selectedType === CIRCLE) {
        shape = new Circle();
    }

    shape.position = coordConvert(ev);
    shape.color = g_selectedColor.slice();
    shape.brushSize = g_selectedBrushSize;
    shape.segments = g_selectedSeg;

    g_shapesList.push(shape);
    renderAllShapes();
}

// Convert mouse event coordinates to WebGL coordinates
function coordConvert(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

// Render all shapes on the canvas
function renderAllShapes() {
    var startTime = performance.now();

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < g_shapesList.length; i++) {
        g_shapesList[i].render();
    }

    var duration = performance.now() - startTime;
    setText("numdot: " + g_shapesList.length + " ms: " + Math.floor(duration) + 
            " fps: " + (Math.floor(10000 / duration)) / 10 + 
            " pos: " + printPos, "numdot");
}

// Display text on the HTML page
function setText(text, htmlID) {
    var hElem = document.getElementById(htmlID);

    if (!hElem) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }

    hElem.innerHTML = text;
}

// Initialize WebGL and shaders
function setupWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
}

function connectToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to initialize shaders.");
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }

    u_BrushSize = gl.getUniformLocation(gl.program, "u_BrushSize");
    if (!u_BrushSize) {
        console.log("Failed to get the storage location of u_BrushSize");
        return;
    }
}

// Main function
function main() {
    setupWebGL();
    connectToGLSL();
    handleInput();

    canvas.onmousedown = function (ev) {
        click(ev);
    };

    if (!drawingPoly) {
        canvas.onmousemove = function (ev) {
            if (ev.buttons == 1) {
                click(ev);
            }
        };
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}
