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

class Cube {
    constructor(){
        this.type = "cube"
        this.color = [1.0, 1.0, 1.0, 1.0]
        this.matrix = new Matrix4()
        // this.normalMatrix = new Matrix4()
        this.textureSelect = 0
    }
    
    render(){
        var rgba = this.color
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3])
        gl.uniform1i(u_Select, this.textureSelect)
        
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
        // front 
        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3DUVNormal([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0], [0,0,-1, 0,0,-1, 0,0,-1]);
        drawTriangle3DUVNormal([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1], [0,0,-1, 0,0,-1, 0,0,-1]);

        // back
        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3DUVNormal([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1], [0,0,1, 0,0,1, 0,0,1]);
        drawTriangle3DUVNormal([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1], [0,0,1, 0,0,1, 0,0,1]);

        // top
        // gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3DUVNormal([0,1,1, 1,1,1, 1,1,0], [0,0, 1,0, 1,1], [0,1,0, 0,1,0, 0,1,0]);
        drawTriangle3DUVNormal([1,1,0, 0,1,1, 0,1,0], [1,1, 0,0, 0,1], [0,1,0, 0,1,0, 0,1,0]);

        // bottom
        // gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3DUVNormal([0,0,1, 1,0,1, 1,0,0], [0,0, 1,0, 1,1], [0,-1,0, 0,-1,0, 0,-1,0]);
        drawTriangle3DUVNormal([1,0,0, 0,0,1, 0,0,0], [1,1, 0,0, 0,1], [0,-1,0, 0,-1,0, 0,-1,0]);

        // left
        // gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVNormal([0,0,0, 0,1,1, 0,0,1], [0,0, 1,1, 0,1], [-1,0,0, -1,0,0, -1,0,0]);
        drawTriangle3DUVNormal([0,0,0, 0,1,0, 0,1,1], [0,0, 0,1, 1,1], [-1,0,0, -1,0,0, -1,0,0]);

        // right
        // gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3DUVNormal([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 0,1], [1,0,0, 1,0,0, 1,0,0]);
        drawTriangle3DUVNormal([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1], [1,0,0, 1,0,0, 1,0,0]);
    }
}

class Sphere {
    constructor() {
        this.type = 'sphere';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.textureSelect = -2;
        this.verts32 = new Float32Array([]);
    }

    render() {
        var rgba = this.color;
        gl.uniform1i(u_Select, this.textureSelect);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var d = Math.PI / 10;
        var dd = Math.PI / 10;

        let sin = Math.sin;
        let cos = Math.cos;

        for (var t = 0; t < Math.PI; t += d) {
            for (var r = 0; r < 2 * Math.PI; r += d) {
                var p1 = [sin(t) * cos(r), sin(t) * sin(r), cos(t)];

                var p2 = [sin(t + dd) * cos(r), sin(t + dd) * sin(r), cos(t + dd)];
                var p3 = [sin(t) * cos(r + dd), sin(t) * sin(r + dd), cos(t)];
                var p4 = [sin(t + dd) * cos(r + dd), sin(t + dd) * sin(r + dd), cos(t + dd)];

                var uv1 = [t / Math.PI, r / (2 * Math.PI)];
                var uv2 = [(t + dd) / Math.PI, r / (2 * Math.PI)];
                var uv3 = [t / Math.PI, (r + dd) / (2 * Math.PI)];
                var uv4 = [(t + dd) / Math.PI, (r + dd) / (2 * Math.PI)];

                var v = [];
                var uv = [];
                v = v.concat(p1); uv = uv.concat(uv1);
                v = v.concat(p2); uv = uv.concat(uv2);
                v = v.concat(p4); uv = uv.concat(uv4);

                gl.uniform4f(u_FragColor, 1, 1, 1, 1);
                drawTriangle3DUVNormal(v, uv, v);

                v = [];
                uv = [];
                v = v.concat(p1); uv = uv.concat(uv1);
                v = v.concat(p4); uv = uv.concat(uv4);
                v = v.concat(p3); uv = uv.concat(uv3);

                gl.uniform4f(u_FragColor, 1, 0, 0, 1);
                drawTriangle3DUVNormal(v, uv, v);
            }
        }
    }
}
