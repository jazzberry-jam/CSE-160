class Point {
    constructor(position, color, brushSize) {
        this.type = "point";
        this.position = position
        this.color = color
        this.brushSize = brushSize
    }
    
    render() {
        var xy = this.position;
        var rgba = this.color;
        var brushSize = this.brushSize;
        
        // Pass the position of a point to a_Position variable
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Pass the size of a point to u_Size variable
        gl.uniform1f(u_BrushSize, brushSize);
        // Draw
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
