// asg0.js

function main() {
    // Retrieve the <canvas> element

    var canvas = document.getElementById('example');
    if (!canvas) {
        console.log('Failed to retrieve the <canvas> element'); 
        return false;
    }
    
    // Get the rendering context for 2DCG
    var ctx = canvas.getContext('2d'); 

    // Draw a black rectangle 
    ctx.fillStyle = 'black'; // Set a black color 
    ctx.fillRect(0, 0, 400, 400); // Fill a rectangle with the color 

    let v1 = new Vector3();
    v1.elements[0] = 2.25
    v1.elements[1] = 2.25
    v1.elements[2] = 0
    drawVector(v1, "red");
}

function drawVector(v, color) {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d'); 

    ctx.beginPath(); 
    ctx.moveTo(200, 200); 
    ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
    ctx.strokeStyle = color; 
    ctx.lineWidth = 2; 
    ctx.stroke(); 
}

function constructVec(x, y, z) {
    let v = new Vector3();
    v.elements[0] = x;
    v.elements[1] = y;
    v.elements[2] = z; 

    return v;
}

function angleBetween(v1, v2) {
    let rad = Math.acos(Vector3.dot(v1, v2)/(v1.magnitude() * v2.magnitude()));
    return (rad * 180) / Math.PI;
}

function handleDrawEvent() {
    var canvas = document.getElementById('example');
    var ctx = canvas.getContext('2d'); 

    ctx.fillStyle = 'black'; // Set a black color 
    ctx.fillRect(0, 0, 400, 400); // Fill a rectangle with the color 

    let x1 = document.getElementById("xinput1").value;
    let x2 = document.getElementById("xinput2").value;
    let y1 = document.getElementById("yinput1").value;
    let y2 = document.getElementById("yinput2").value;

    let v1 = constructVec(x1, y1, 0);
    let v2 = constructVec(x2, y2, 0);

    drawVector(v1, "red");
    drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
    handleDrawEvent();

    let x1 = document.getElementById("xinput1").value;
    let x2 = document.getElementById("xinput2").value;
    let y1 = document.getElementById("yinput1").value;
    let y2 = document.getElementById("yinput2").value;

    let v1 = constructVec(x1, y1, 0);
    let v2 = constructVec(x2, y2, 0);

    let op = document.getElementById("selectop").value;
    let scalar = document.getElementById("scalarinput").value;

    switch (op) {
        case "add":
            v1.add(v2); drawVector(v1, "green"); 
            break;

        case "sub":
            v1.sub(v2); drawVector(v1, "green");
            break;

        case "mul":
            v1.mul(scalar); drawVector(v1, "green");
            v2.mul(scalar); drawVector(v2, "green");
            break;

        case "div":
            v1.div(scalar); drawVector(v1, "green");
            v2.div(scalar); drawVector(v2, "green");
            break;

        case "mag":
            console.log(`Magnitude of v1: ${v1.magnitude()} \nMagnitude of v2: ${v2.magnitude()}`);
            break;

        case "normal":
            v1.normalize(); drawVector(v1, "green");
            v2.normalize(); drawVector(v2, "green");
            break;

        case "angle":
            console.log(`Angle : ${angleBetween(v1, v2)}`);
            break;

        case "area":
            console.log(`Area : ${(Vector3.cross(v1, v2).magnitude())/2}`);
            break;

        default:
            return;
    } 

}