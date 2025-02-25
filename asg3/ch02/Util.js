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
