function clearCanvas() {
    g_shapesList = [];
    renderAllShapes();
}

function undoAction() {
    if (g_shapesList.length != 0) {
        undoStack.push(g_shapesList.pop())
    }
    
    renderAllShapes()
}

function redoAction() {
    if (undoStack.length != 0) {
        g_shapesList.push(undoStack.pop())
    }
    
    renderAllShapes()
}

function selectPointTool() {
    handleToolChange();
    document.getElementById("selectpoint").classList.add('pressed');
    document.getElementById("selecttriangle").classList.remove('pressed');
    document.getElementById("selectcircle").classList.remove('pressed');
    document.getElementById("selectpoly").classList.remove('pressed');
    g_selectedType = POINT;
}

function selectTriangleTool() {
    handleToolChange();
    document.getElementById("selectpoint").classList.remove('pressed');
    document.getElementById("selecttriangle").classList.add('pressed');
    document.getElementById("selectcircle").classList.remove('pressed');
    document.getElementById("selectpoly").classList.remove('pressed');
    g_selectedType = TRIANGLE;
}

function selectCircleTool() {
    handleToolChange();
    document.getElementById("selectpoint").classList.remove('pressed');
    document.getElementById("selecttriangle").classList.remove('pressed');
    document.getElementById("selectcircle").classList.add('pressed');
    document.getElementById("selectpoly").classList.remove('pressed');
    g_selectedType = CIRCLE;
}

function selectPolyTool() {
    if (drawingPoly) {
        handleToolChange();
        document.getElementById("selectpoly").classList.remove('pressed');
    }
    
    else {
        g_selectedType = POLY;
        document.getElementById("selectpoint").classList.remove('pressed');
        document.getElementById("selecttriangle").classList.remove('pressed');
        document.getElementById("selectcircle").classList.remove('pressed');
        document.getElementById("selectpoly").classList.add('pressed');
        setText("Drawing...", "selectpoly");
        drawingPoly = true;
    }
}

function showExample() {
    let image = document.getElementById("wallsocket")
    
    if (image.hasAttribute("hidden")) {
        image.removeAttribute("hidden")
    }
    else {
        image.setAttribute("hidden", "true")
    }
}

// reset state when switching tools
function handleToolChange() {
    if (drawingPoly) {
        finalizePolygon()
        g_selectedPolyVerts = [];
        drawingPoly = false;
        setText("Polygon", "selectpoly");
    }
}
