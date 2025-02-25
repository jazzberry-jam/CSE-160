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
    // document.addEventListener("keydown", handleKeyDown);
    
    // // actions
    // document.getElementById("clearbutton").addEventListener("mouseup", clearCanvas);
    // document.getElementById("undobutton").addEventListener("mouseup", undoAction);
    // document.getElementById("redobutton").addEventListener("mouseup", redoAction);
    // document.getElementById("storebutton").addEventListener("mouseup", saveShapesLocally);

    // // color
    // document.getElementById("redslide").addEventListener("mousemove", function () {
    //     g_selectedColor[0] = this.value / 100;
    //     updateColorIndicator();
    // });
    // document.getElementById("greenslide").addEventListener("mousemove", function () {
    //     g_selectedColor[1] = this.value / 100;
    //     updateColorIndicator();
    // });
    // document.getElementById("blueslide").addEventListener("mousemove", function () {
    //     g_selectedColor[2] = this.value / 100;
    //     updateColorIndicator();
    // });
    
    // // brush properties
    // document.getElementById("segslide").addEventListener("mouseup", function () {
    //     g_selectedSeg = this.value;
    // });
    // document.getElementById("brushsizeslide").addEventListener("mousemove", function () {
    //     g_selectedBrushSize = this.value;
    //     updateColorIndicator();
    // });
    
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
    document.getElementById("angleYslide").addEventListener("mousemove", function () {
        g_globalAngleY = this.value;
        renderAllShapes();
    });
    // document.getElementById("appangle").addEventListener("mousemove", function () {
    //     g_appAngle = this.value;
    //     renderAllShapes();
    // });

    // // shapes
    // document.getElementById("selectpoint").onclick = selectPointTool;
    // document.getElementById("selecttriangle").onclick = selectTriangleTool;
    // document.getElementById("selectcircle").onclick = selectCircleTool;
    // document.getElementById("selectpoly").onclick = selectPolyTool;
    
    // // example
    // document.getElementById("showexample").onclick = showExample;
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
