import * as THREE from 
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { startGame, updateGame } from "./game.js";


// =========================
// ENGINE
// =========================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

scene.fog = new THREE.Fog(
    0x87ceeb,
    20,
    200
);


// =========================
// CAMERA
// =========================

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

camera.position.set(
    0,
    3,
    8
);


// =========================
// RENDERER
// =========================

const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    window.devicePixelRatio
);

document.body.appendChild(
    renderer.domElement
);


// =========================
// LIGHT
// =========================

const ambient = new THREE.AmbientLight(
    0xffffff,
    1
);

scene.add(ambient);


const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(
    20,
    50,
    20
);

scene.add(sun);


// =========================
// START GAME
// =========================

startGame(
    scene,
    camera
);


// =========================
// LOOP
// =========================

const clock = new THREE.Clock();


function animate(){

    requestAnimationFrame(
        animate
    );


    const delta =
        clock.getDelta();


    updateGame(
        delta,
        camera
    );


    renderer.render(
        scene,
        camera
    );

}


animate();


// =========================
// RESIZE
// =========================

window.addEventListener(
"resize",
()=>{

camera.aspect =
window.innerWidth /
window.innerHeight;


camera.updateProjectionMatrix();


renderer.setSize(
window.innerWidth,
window.innerHeight
);

});
