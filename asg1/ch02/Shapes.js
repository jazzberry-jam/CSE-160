class Point {
    constructor() {
        this.type = "point";
        this.position = [0.0, 0.0, 0.0]
        this.color = [0.0, 0.0, 0.0, 1.0]
        this.brushSize = 10.0
        this.segments = 0
    }
    
    render() {
        var xy = this.position;
        var rgba = this.color;
        var brushSize = this.brushSize;
    
        // Create a buffer for the point position
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.error("Failed to create the buffer object");
            return;
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(xy), gl.STATIC_DRAW);
    
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
    
        // Pass color and size
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_BrushSize, brushSize);
    
        // Draw the point
        gl.drawArrays(gl.POINTS, 0, 1);
    
        // Unbind buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }    
}

class Triangle {
    constructor() {
        this.type = 'triangle';
        this.position = [0.0, 0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.brushSize = 5.0;
        this.segments = 0;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var brushSize = this.brushSize;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniform1f(u_BrushSize, brushSize);
        var delta = this.brushSize/200.0;
        drawTriangle( [xy[0], xy[1], xy[0]+delta, xy[1], xy[0], xy[1]+delta] );
    }
}

class Circle {
    constructor() {
        this.type = 'circle';
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.brushSize = 5.0;
        this.segments = 10;
        this.rotation = Math.random() * 360;
    }

    render() {
        var xy = this.position;
        var rgba = this.color;
        var brushSize = this.brushSize;

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Draw
        var delta = brushSize/200.0; // delta

        // Starting angle offset to rotate a triangle
        var startAngle = this.rotation;
        
        var angleStep = 360/this.segments;
        for(var angle = startAngle; angle < startAngle + 360; angle = angle + angleStep) {
            var centerPt = [xy[0], xy[1]];
            var angle1 = angle;
            var angle2 = angle + angleStep;
            
            var vec1 = [Math.cos(angle1*Math.PI/180)*delta, Math.sin(angle1*Math.PI/180)*delta];
            var vec2 = [Math.cos(angle2*Math.PI/180)*delta, Math.sin(angle2*Math.PI/180)*delta];
            var pt1  = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
            var pt2  = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

            drawTriangle( [xy[0], xy[1], pt1[0], pt1[1], pt2[0], pt2[1]] );
        }
    }
}

class Poly {
    constructor() {
        this.type = 'poly';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.vertices = []
        this.segments = 0
    }
    
    render() {
        if (this.vertices.length < 3) {
            console.error("Poly requires at least 3 vertices to render.");
            return;
        }
    
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    
        const flattenedVertices = [];
        for (const vertex of this.vertices) {
            flattenedVertices.push(vertex[0], vertex[1]);
        }
    
        const vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.error('Failed to create the buffer object');
            return;
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattenedVertices), gl.DYNAMIC_DRAW);
    
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
    
        // Draw the polygon using TRIANGLE_FAN
        gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vertices.length);
    
        // Unbind the buffer to prevent affecting other shapes
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }    
}

function drawTriangle(vertices) {
    // Number of vertices
    var n = 3;

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
