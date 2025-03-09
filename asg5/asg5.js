import * as THREE from 'three';
import { ColorGUIHelper, DegRadHelper, makeXYZGUI, resizeRendererToDisplaySize } from './util.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    RectAreaLightUniformsLib.init();

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(10, 10, 25);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('black');
	
	const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0;
    bloomPass.strength = 2;
    bloomPass.radius = 1;

    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(fxaaPass);
    composer.addPass(bloomPass);

	// ground plane
    {
        const planeSize = 40;
        const textureLoader = new THREE.TextureLoader();
        const grassTexture = textureLoader.load('./assets/grass/Stylized_Grass_003_basecolor.jpg');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.colorSpace = THREE.SRGBColorSpace;

        const grassNormalMap = textureLoader.load('./assets/grass/Stylized_Grass_003_normal.jpg');
        grassNormalMap.wrapS = THREE.RepeatWrapping;
        grassNormalMap.wrapT = THREE.RepeatWrapping;

        const grassDisplacementMap = textureLoader.load('./assets/grass/Stylized_Grass_003_height.png');
        grassDisplacementMap.wrapS = THREE.RepeatWrapping;
        grassDisplacementMap.wrapT = THREE.RepeatWrapping;

        const repeats = planeSize / 4;
        grassTexture.repeat.set(repeats, repeats);
        grassNormalMap.repeat.set(repeats, repeats);
        grassDisplacementMap.repeat.set(repeats, repeats);

        const groundMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            normalMap: grassNormalMap,
            displacementMap: grassDisplacementMap,
            displacementScale: 0.1,
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });

        const planeGeometry = new THREE.PlaneGeometry(planeSize, planeSize, 64, 64);
        const groundMesh = new THREE.Mesh(planeGeometry, groundMaterial);
        groundMesh.rotation.x = Math.PI * -0.5;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);
    }

	// windmill
    const mtlLoader = new MTLLoader();
    mtlLoader.load("./assets/windmill/windmill.mtl", (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load("./assets/windmill/windmill.obj", (obj) => {
            obj.traverse((child) => {
                if (child.isMesh) {
                    if (!(child.material instanceof THREE.MeshStandardMaterial)) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: child.material.color,
                            map: child.material.map,
                            roughness: 0.8,
                            metalness: 0.2
                        });
                    }
                }
            });

            scene.add(obj);
            obj.scale.set(1, 1, 1);
            obj.rotation.set(0, -1.5, 0);
        });
    });

	// floating shapes & point lights
    const shapes = [];
    const geometryTypes = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(1, 32, 32),
        new THREE.CylinderGeometry(0.5, 0.5, 2, 32)
    ];

    for (let i = 0; i < 20; i++) {
        const geometry = geometryTypes[i % 3];
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(
            Math.random() * 50 - 25,
            Math.random() * 10,
            Math.random() * 50 - 25
        );

        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        const pointLight = new THREE.PointLight(Math.random() * 0xffffff, 1, 10);
        pointLight.position.set(0, 0, 0);
        pointLight.castShadow = true;
        mesh.add(pointLight);

        scene.add(mesh);
        shapes.push({ mesh, pointLight });
    }

	// trees
    let treeModel;
    mtlLoader.load("./assets/tree/Lowpoly_tree_sample.mtl", (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load("./assets/tree/Lowpoly_tree_sample.obj", (obj) => {
            treeModel = obj;

            const planeSize = 40;
            const radius = planeSize / 2;
            const numTrees = 100;

            const treePositions = [];

            for (let i = 0; i < numTrees; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = radius * (0.8 + Math.random() * 0.2);
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                const y = 0 + (Math.random() - 0.5) * 0.5;

                treePositions.push({ x, y, z });
            }

            treePositions.forEach(pos => {
                const treeClone = treeModel.clone();
                treeClone.position.set(pos.x, pos.y, pos.z);
                const toScale = Math.pow(Math.random(), 0.5) * 0.25;
                treeClone.scale.set(toScale, toScale, toScale);
                treeClone.rotation.y = Math.random() * Math.PI * 2;
                scene.add(treeClone);
            });
        });
    });

	// lighting & gui
    {
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0x8a8a8a, 0.2);
        directionalLight.position.set(5, 10, 7.5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        scene.add(directionalLight);

        const rectAreaLight = new THREE.RectAreaLight(0xffffff, 2, 5, 5);
        rectAreaLight.position.set(0, 12, 10);
        rectAreaLight.rotation.x = THREE.MathUtils.degToRad(-90);
        scene.add(rectAreaLight);

        const skyLoader = new THREE.CubeTextureLoader();
        const skyTexture = skyLoader.load([
            './assets/skybox/px.png',
            './assets/skybox/nx.png',
            './assets/skybox/py.png',
            './assets/skybox/ny.png',
            './assets/skybox/pz.png',
            './assets/skybox/nz.png'
        ]);
        scene.background = skyTexture;

        const geometry = new THREE.BoxGeometry(100, 100, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000, envMap: skyTexture });
        const sky = new THREE.Mesh(geometry, material);
        scene.add(sky);

        const helper = new RectAreaLightHelper(rectAreaLight);
        rectAreaLight.add(helper);

        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(ambientLight, 'color'), 'value').name('Ambient Light Color');
        gui.add(ambientLight, 'intensity', 0, 2, 0.01).name('Ambient Light Intensity');

        gui.addColor(new ColorGUIHelper(directionalLight, 'color'), 'value').name('Directional Light Color');
        gui.add(directionalLight, 'intensity', 0, 2, 0.01).name('Directional Light Intensity');

        gui.addColor(new ColorGUIHelper(rectAreaLight, 'color'), 'value').name('RectArea Light Color');
        gui.add(rectAreaLight, 'intensity', 0, 10, 0.01).name('RectArea Light Intensity');
        gui.add(rectAreaLight, 'width', 0, 20).name('RectArea Light Width');
        gui.add(rectAreaLight, 'height', 0, 20).name('RectArea Light Height');
        gui.add(new DegRadHelper(rectAreaLight.rotation, 'x'), 'value', -180, 180).name('RectArea Light X Rotation');
        gui.add(new DegRadHelper(rectAreaLight.rotation, 'y'), 'value', -180, 180).name('RectArea Light Y Rotation');
        gui.add(new DegRadHelper(rectAreaLight.rotation, 'z'), 'value', -180, 180).name('RectArea Light Z Rotation');

        makeXYZGUI(gui, rectAreaLight.position, 'RectArea Light Position');
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer, camera)) {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            composer.setSize(width, height);
        }

        shapes.forEach((shape, index) => {
            const { mesh, pointLight } = shape;
            mesh.rotation.x += 0.01;
            mesh.rotation.y += 0.01;
            mesh.position.y = Math.sin(time + index) * 2 + 5;
            pointLight.position.copy(mesh.position);
        });

        composer.render();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
