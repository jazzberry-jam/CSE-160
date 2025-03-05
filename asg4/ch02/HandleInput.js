// handle polygon-specific input and rendering
function handlePolygonTool(ev) {
    let coord = coordConvert(ev);
    g_selectedPolyVerts.push(coord);
    
    let point = new Point();
    point.position = coord
    point.color = [1.0, 0.0, 0.0, 1.0].slice();
    point.brushSize = 10;
    g_tempPolyPoints.push(point)
    
    for (let i = 0; i < g_tempPolyPoints.length; i++) {
        g_tempPolyPoints[i].render()
    }

    if (g_selectedPolyVerts.length >= 3 && !drawingPoly) {
        finalizePolygon();
    }
}

function handleKeyDown(ev) {
    let key = ev.key; // get the key pressed
    let modifier = 
        (ev.ctrlKey || ev.metaKey) && ev.shiftKey ? 'Ctrl+Shift+' : (ev.shiftKey ? 'Shift+' : (ev.ctrlKey || ev.metaKey) ? 'Ctrl+' : '');
        
    // combine modifier (if any) and key to create a shortcut string
    let keyInput = `${modifier}${key.toUpperCase()}`;
    // console.log(shortcut)
  
    // check if the shortcut exists in the mapping
    if (SHORTCUTS[keyInput]) {
        ev.preventDefault(); // prevents default browser shortcut
        SHORTCUTS[keyInput](); 
    }
}

// handle input changes and tool selection
function handleInput() {
    document.getElementById("toggleanimation").addEventListener("mouseup", function () {
        if (g_animationToggle) {
            g_animationToggle = false
        }
        else {
            g_animationToggle = true
            tick()
        }
    });
    
    // 3d
    document.getElementById("angleXslide").addEventListener("mousemove", function () {
        g_globalAngleX = this.value;
        renderAllShapes();
    });
    
    document.getElementById('normalToggle').onclick = function() {if (g_normalOn) {g_normalOn = false} else {g_normalOn = true}};
    
    document.getElementById('lightx').addEventListener('mousemove', function(ev) {if (ev.buttons == 1) {g_lightPos[0] = this.value/100; renderAllShapes();}});
    document.getElementById('lighty').addEventListener('mousemove', function(ev) {if (ev.buttons == 1) {g_lightPos[1] = this.value/100; renderAllShapes();}});
    document.getElementById('lightz').addEventListener('mousemove', function(ev) {if (ev.buttons == 1) {g_lightPos[2] = this.value/100; renderAllShapes();}});
    
    document.getElementById('lightToggle').onclick = function() {if (g_lightOn) {g_lightOn = false; document.getElementById("slightToggle").style.display = "none";} else {g_lightOn = true; document.getElementById("slightToggle").style.display = "";}};

    document.getElementById('slightToggle').onclick = function() {if (g_SlightOn) {g_SlightOn = false} else {g_SlightOn = true}};
}

// handle clicks and shape creation
function handleClick(ev) {
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
    lastPos = shape.position
    shape.color = g_selectedColor.slice();
    shape.brushSize = g_selectedBrushSize;
    shape.segments = g_selectedSeg;

    g_shapesList.push(shape);
    renderAllShapes();
}

function keydown(ev){
    if(ev.keyCode==39 || ev.keyCode == 68){ // Right Arrow or D
       g_camera.right();
    } else if (ev.keyCode==37 || ev.keyCode == 65){ // Left Arrow or A
       g_camera.left();
    } else if (ev.keyCode==38 || ev.keyCode == 87){ // up Arrow or W
       g_camera.forward();
    } else if (ev.keyCode==40 || ev.keyCode == 83){ // down Arrow or S
       g_camera.back();
    } else if (ev.keyCode==81){ // Q
       g_camera.panLeft();
    } else if (ev.keyCode==69){ // E
       g_camera.panRight();
    }
    
    renderAllShapes();
 }

 function mouseCam(ev){
    coord = coordConvert(ev);
    
    if (coord[0] < 0.5){
       g_camera.panMLeft(coord[0]*-10);
    } else {
       g_camera.panMRight(coord[0]*-10);
    }
 }
