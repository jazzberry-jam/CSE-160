// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  attribute vec3 a_Normal;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform float u_BrushSize;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    gl_PointSize = u_BrushSize;
    v_UV = a_UV;
    // v_Normal = normalize(vec3(u_ModelMatrix * vec4(a_Normal, 1)));
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }\n`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  varying vec4 v_VertPos;
  uniform sampler2D u_Sampler0;
  uniform int u_Select;
  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform bool u_lightOn;
  uniform bool u_SlightOn;
  
  void main() {
    if (u_Select == -3) {
      // Render normals as colors
      gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);
    } else if (u_Select == -2) {
      // Render solid color
      gl_FragColor = u_FragColor;
    } else if (u_Select == -1) {
      // Render UV coordinates as colors
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_Select == 0) {
      // Render texture
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else {
      // Fallback to red for debugging
      gl_FragColor = vec4(1, .2, .2, 1); // Error color
    }
      
    vec3 lightVector = u_lightPos - vec3(v_VertPos);
    float r = length(lightVector);
    
    // if (r<1.0){
    //   gl_FragColor = vec4(1,0,0,1);
    // } else if(r <2.0) {
    //   gl_FragColor = vec4(0,1,0,1);
    
    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r), 1);
    
    vec3 L = normalize(lightVector);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);

    vec3 R = reflect(-L,N);
    vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
    float specular = pow(max(dot(E,R), 0.0), 10.0);
    vec3 diffuse = vec3(gl_FragColor) * nDotL;
    vec3 ambient = vec3(gl_FragColor) * 0.3;
    
    if (u_lightOn) {
      if (u_SlightOn) {
        gl_FragColor = vec4(specular + diffuse + ambient, 1.0);
      } else {
        gl_FragColor = vec4(diffuse + ambient, 1.0);
      }
    } else {
      gl_FragColor = gl_FragColor;
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
var a_Normal;

let u_FragColor;
let u_BrushSize;
let u_GlobalRotateMatrix;
let u_ModelMatrix;
let u_Sampler;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_Select;
let u_cameraPos;
let u_lightOn;
let u_SlightOn;

var g_selectedColor = [0.0, 0.0, 0.0, 1.0];
var g_selectedBrushSize = 10.0;
var g_selectedType = POINT;
var g_selectedSeg = 10;
var g_selectedPolyVerts = [];
var g_tempPolyPoints = []
var g_globalAngleX = 180
var g_globalAngleY = 30
var g_appAngle = 0
var g_animationToggle = true
var g_camera;
var g_shapesList = [];
var g_normalOn = false;
var g_lightPos = [0,0,-2];
let g_lightOn = true;
let g_SlightOn = true;

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
    var globalRotMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0)
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements)
    
    var projMat = new Matrix4()
    projMat.setPerspective(90, canvas.width/canvas.height, .1, 100)
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements)
    
    var viewMat = new Matrix4()
    viewMat.setLookAt(0,0,-2.5, 0,0,0, 0,1,0)
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements)
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.uniform3f(u_lightPos, g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
    gl.uniform1i(u_lightOn, g_lightOn);
    gl.uniform1i(u_SlightOn, g_SlightOn);
    
    drawAll()
}

function main() {
    // util
    setupWebGL();
    connectToGLSL();
    
    // input
    handleInput();
    
    g_camera = new Camera();
    document.onkeydown = keydown;

    canvas.onmousemove = function(ev) {
        mouseCam(ev);
    }
    canvas.onmousedown = function (ev) {
        handleClick(ev);
    };
    
    initTextures()

    gl.clearColor(1.0, 1.0, 1.0, 0.0);

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
    updateAnimationAngles()
  }
}
