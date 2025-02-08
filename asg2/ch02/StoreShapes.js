function saveShapesLocally() {
    const json = JSON.stringify(g_shapesList, null, 2); // Pretty-print the JSON
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'shapes.json';
    link.click();

    URL.revokeObjectURL(url);
}

function parseShapes() {
    const shapes = JSON.parse(JSON.stringify(WALLSOCKET));
    const shapeObjects = [];

    for (const shape of shapes) {
        let shapeObj;

        switch (shape.type) {
            case "point":
                shapeObj = new Point();
                shapeObj.position = shape.position;
                shapeObj.color = shape.color;
                shapeObj.brushSize = shape.brushSize;
                break;

            case "circle":
                shapeObj = new Circle();
                shapeObj.position = shape.position;
                shapeObj.color = shape.color;
                shapeObj.brushSize = shape.brushSize;
                shapeObj.segments = shape.segments;
                shapeObj.rotation = shape.rotation;
                break;

            case "triangle":
                shapeObj = new Triangle();
                shapeObj.vertices = shape.vertices;
                shapeObj.color = shape.color;
                break;

            case "poly":
                shapeObj = new Poly();
                shapeObj.vertices = shape.vertices;
                shapeObj.color = shape.color;
                shapeObj.segments = shape.segments;
                break;

            default:
                console.warn("Unknown shape type:", shape.type);
                continue;
        }

        shapeObjects.push(shapeObj);
    }

    g_shapesList = shapeObjects;
    renderAllShapes();
}
