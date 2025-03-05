// convert mouse event coordinates to WebGL coordinates
function coordConvert(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x, y];
}

// display text on the HTML page
function setText(text, htmlID) {
    var hElem = document.getElementById(htmlID);

    if (!hElem) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }

    hElem.innerHTML = text;
}

function setupWebGL() {
    canvas = document.getElementById("webgl");
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, depth: true });

    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
    
    gl.enable(gl.DEPTH_TEST)
}

function connectToGLSL() {
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to initialize shaders.");
        return;
    }

    a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return;
    }
    
    a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
    if (a_Normal < 0) {
        console.log("Failed to get the storage location of a_Normal");
        return;
    }
    
    a_UV = gl.getAttribLocation(gl.program, "a_UV");
    if (a_UV < 0) {
        console.log("Failed to get the storage location of a_UV");
        return;
    }

    u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
    if (!u_FragColor) {
        console.log("Failed to get the storage location of u_FragColor");
        return;
    }
    
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
    if (!u_ProjectionMatrix) {
        console.log("Failed to get the storage location of u_ProjectionMatrix");
        return;
    }
    
    u_Select = gl.getUniformLocation(gl.program, "u_Select");
    if (!u_Select) {
        console.log("Failed to get the storage location of u_Select");
        return;
    }
    
    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    if (!u_ViewMatrix) {
        console.log("Failed to get the storage location of u_ViewMatrix");
        return;
    }
    
    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix");
        return;
    }
    
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, "u_GlobalRotateMatrix");
    if (!u_GlobalRotateMatrix) {
        console.log("Failed to get the storage location of u_GlobalRotateMatrix");
        return;
    }
    
    // Get the storage location of u_Sampler
    u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler'); 
        return false; 
    }
}

function updateColorIndicator() {
    let colorIndicator = document.getElementById("indicator");
    colorIndicator.style.backgroundColor = `
        rgb(${Math.floor(g_selectedColor[0] * 255)}, 
        ${Math.floor(g_selectedColor[1] * 255)}, 
        ${Math.floor(g_selectedColor[2] * 255)})`;
         
    colorIndicator.style.width = `${g_selectedBrushSize}px`
    colorIndicator.style.height = `${g_selectedBrushSize}px`
}


function initTextures () { 
    var image = new Image(); // Create the image object 
    if (!image) {
        console.log('Failed to create the image object'); 
        return false;
    }
    
    // Register the event handler to be called on loading an image 
    image.src = './chess.jpg';
    image.onload = function() { loadTexture(image) }; // Tell the browser to load an image
    
    return true;
}

function loadTexture(image) {
    var texture = gl.createTexture(); 
    if (!texture) {
        // Create a texture object
        console.log('Failed to create the texture object');
        return false;
    }
    
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, 0);
    console.log("textures loaded")
}

function drawAll() {
    //////
    
    var body1 = new Cube();
    body1.textureSelect = 0
    body1.color = [1.0,0.0,0.0,1.0];
    body1.matrix.scale(.4,.4,.4,1)
    body1.matrix.translate(-1,-1,0,1)
    body1.render()
    
    var body2 = new Cube(); 
    body2.color = [0.0,0.0,1.0,1.0];
    body2.matrix = new Matrix4(body1.matrix)
    body2.matrix.scale(1.6,1.4,1.5,1)
    body2.matrix.translate(0.6,-0.1,-.2,1)
    body2.render()
    
    var head = new Cube(); 
    head.color = [0.0,1.0,0.0,1.0];
    head.matrix = new Matrix4(body1.matrix)
    head.matrix.scale(1.2,1.2,1.2,1)
    head.matrix.translate(-1,-.1,-.1,1)
    head.render()
    
    var arm1 = new Cube()
    arm1.color = [0,1.0,1.0,1.0];
    arm1.matrix = new Matrix4(body1.matrix)
    arm1.matrix.rotate(Math.sin((g_seconds*10)+1)*10,1,0,0)
    arm1.matrix.translate(.9,.5,1,1)
    arm1.matrix.rotate(30, 1, 0, 0)
    arm1.matrix.rotate(-30, 0, 0, 1)
    arm1.matrix.rotate(-75, 0, 1, 0)
    arm1.matrix.scale(2,.3,.3,1)
    arm1.render()
    
    var arm2 = new Cube()
    arm2.color = [1.0,1.0,0,1.0];
    arm2.matrix = new Matrix4(body1.matrix)
    arm2.matrix.rotate(Math.sin((g_seconds*10)+9)*10,1,0,0)
    arm2.matrix.translate(0.7,.5,1,1)
    arm2.matrix.rotate(30, 1, 0, 0)
    arm2.matrix.rotate(-15, 0, 0, 1)
    arm2.matrix.rotate(-90, 0, 1, 0)
    arm2.matrix.scale(2,.3,.3,1)
    arm2.render()
    
    var arm3 = new Cube()
    arm3.color = [1.0,0.0,1.0,1.0];
    arm3.matrix = new Matrix4(body1.matrix)
    arm3.matrix.rotate(Math.sin((g_seconds*10)+2)*10,1,0,0)
    arm3.matrix.translate(0.5,.5,1,1)
    arm3.matrix.rotate(30, 1, 0, 0)
    arm3.matrix.rotate(15, 0, 0, 1)
    arm3.matrix.rotate(-105, 0, 1, 0)
    arm3.matrix.scale(2,.3,.3,1)
    arm3.render()
    
    var arm4 = new Cube()
    arm4.color = [0,1.0,1.0,1.0];
    arm4.matrix = new Matrix4(body1.matrix)
    arm4.matrix.rotate(Math.sin((g_seconds*10)+8)*10,1,0,0)
    arm4.matrix.translate(1.1,0,1,1)
    arm4.matrix.rotate(180, 0, 1, 0)
    arm4.matrix.translate(.9,.5,1,1)
    arm4.matrix.rotate(30, 1, 0, 0)
    arm4.matrix.rotate(-30, 0, 0, 1)
    arm4.matrix.rotate(-75, 0, 1, 0)
    arm4.matrix.scale(2,.3,.3,1)
    arm4.render()
    
    var arm5 = new Cube()
    arm5.color = [1.0,1.0,0,1.0];
    arm5.matrix = new Matrix4(body1.matrix)
    arm5.matrix.rotate(Math.sin((g_seconds*10)+3)*10,1,0,0)
    arm5.matrix.translate(1.1,0,1,1)
    arm5.matrix.rotate(180, 0, 1, 0)
    arm5.matrix.translate(0.7,.5,1,1)
    arm5.matrix.rotate(30, 1, 0, 0)
    arm5.matrix.rotate(-15, 0, 0, 1)
    arm5.matrix.rotate(-90, 0, 1, 0)
    arm5.matrix.scale(2,.3,.3,1)
    arm5.render()
    
    var arm6 = new Cube()
    arm6.color = [1.0,0.0,1.0,1.0];
    arm6.matrix = new Matrix4(body1.matrix)
    arm6.matrix.rotate(Math.sin((g_seconds*10)+6)*10,1,0,0)
    arm6.matrix.translate(1.1,0,1,1)
    arm6.matrix.rotate(180, 0, 1, 0)
    arm6.matrix.translate(0.5,.5,1,1)
    arm6.matrix.rotate(30, 1, 0, 0)
    arm6.matrix.rotate(15, 0, 0, 1)
    arm6.matrix.rotate(-105, 0, 1, 0)
    arm6.matrix.scale(2,.3,.3,1)
    arm6.render()
    
    var sphere = new Sphere();
    if (g_normalOn) {sphere.textureSelect = -3} else {sphere.textureSelect = -2} 
    sphere.render()
    
    var skybox = new Cube();
    if (g_normalOn) {skybox.textureSelect = -3} else {skybox.textureSelect = -2} 
    skybox.color = [0.9,0.9,0.9,1.0];
    skybox.matrix.scale(-10,-10,-10,1)
    skybox.matrix.translate(-0.5,-0.5,-0.5,1)
    skybox.render()
}
