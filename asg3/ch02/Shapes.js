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
        let vertexBuffer = gl.createBuffer();
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

// ChatGPT showed me earcut triangulation, an algorithm I used to handle convex polygons

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

        let flattenedVertices = [];
        for (let vertex of this.vertices) {
            flattenedVertices.push(vertex[0], vertex[1]);
        }

        let indices = earcut(flattenedVertices);
        console.log(flattenedVertices)
        console.log(indices)
    
        if (indices.length === 0) {
            console.error("Failed to triangulate the polygon.");
            return;
        }
    
        // Prepare the vertex buffer
        let vertexBuffer = gl.createBuffer();
        if (!vertexBuffer) {
            console.error("Failed to create the buffer object");
            return;
        }
    
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flattenedVertices), gl.STATIC_DRAW);
    
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
    
        // Set the color for the polygon
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    
        // Draw the triangles using the indices
        let indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            console.error("Failed to create the index buffer");
            return;
        }
    
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
        // Cleanup
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
}

class Cube {
    constructor(){
        this.type = "cube"
        this.color = [1.0, 1.0, 1.0, 1.0]
        this.matrix = new Matrix4()
        this.textureSelect = 0
    }
    
    render(){
        var rgba = this.color
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3])
        gl.uniform1i(u_Select, this.textureSelect)
        
        // Front 
        drawTriangle3D( [0,0,0, 1,1,0, 1,0,0 ] , [0,0, 1,1, 1,0 ]); 
        drawTriangle3D( [0,0,0, 0,1,0, 1,1,0 ] , [0,0, 0,1, 1,1 ]);
        
        // Back
        drawTriangle3D( [0,0,1, 1,1,1, 0,1,1]);
        drawTriangle3D( [0,0,1, 1,0,1, 1,1,1]);
        
        // Side 1
        drawTriangle3D([0,0,0, 0,1,1, 0,0,1]); 
        drawTriangle3D([0,0,0, 0,1,0, 0,1,1]);
        
        
        // Bottom
        drawTriangle3D( [0,0,1, 1,0,1, 1,0,0]);
        drawTriangle3D( [1,0,0, 0,0,1, 0,0,0]);
        
        gl.uniform4f(u_FragColor, rgba[0]*.95, rgba[1]*.95, rgba[2]*.95, rgba[3]);
        
        // Side 2
        drawTriangle3D([1,0,0, 1,1,1, 1,0,1]); 
        drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);

        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);
        
        // Top
        drawTriangle3D( [0,1,1, 1,1,1, 1,1,0]);
        drawTriangle3D( [1,1,0, 0,1,1, 0,1,0]);
    }
}

function drawTriangle(vertices) {
    var n = 3; // vertices

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

function drawTriangle3D(vertices) {
    var n = 3; // vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV (vertices, uv) {
    var n = 3; // vertices

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
    
    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    
    gl.vertexAttribPointer(a_UV, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
    
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
