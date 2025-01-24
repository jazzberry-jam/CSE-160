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

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_BrushSize;

var g_selectedColor = [0.0, 0.0, 0.0, 1.0]
var g_selectedBrushSize = 10.0

var g_shapesList = []

function handleInput() {    
    document.getElementById("clearbutton").addEventListener("mouseup", function () { g_shapesList = []; renderAllShapes() })
    
    document.getElementById("redslide")  .addEventListener("mouseup", function () { g_selectedColor[0] = this.value/100})
    document.getElementById("greenslide").addEventListener("mouseup", function () { g_selectedColor[1] = this.value/100})
    document.getElementById("blueslide") .addEventListener("mouseup", function () { g_selectedColor[2] = this.value/100})
    
    document.getElementById("brushsizeslide").addEventListener("mouseup", function () { g_selectedBrushSize = this.value})
    
    //document.getElementById("canvassizeslide") .addEventListener("mouseup", function () { g_selectedBrushSize = this.value})
}

function changeColor(color, channel) {
    for (let i in g_colors) {
        g_colors[i][channel] = color
    }
    
    renderAllShapes()
}

function setupWebGL() {
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true} );
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
  }
}

function connectToGLSL () {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    
    u_BrushSize = gl.getUniformLocation(gl.program, 'u_BrushSize');
    if (!u_BrushSize) {
        console.log('Failed to get the storage location of u_BrushSize');
        return;
    }
}

function coordConvert(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return ([x,y])
}

function renderAllShapes() {
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    for(var i = 0; i < g_shapesList.length; i++) {
        g_shapesList[i].render()
    }
}

function main() {
    setupWebGL()
    connectToGLSL()
    handleInput()

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = function(ev) { click(ev) };
    canvas.onmousemove = function(ev) { if (ev.buttons == 1) {click(ev)} };

    // Specify the color for clearing <canvas>
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
    
    let point = new Point
    point.position = coordConvert(ev)
    point.color = g_selectedColor.slice()
    point.brushSize = g_selectedBrushSize
    g_shapesList.push(point)

    renderAllShapes()
}
