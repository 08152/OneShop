import * as THREE from 
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


// =========================
// GAME STATE
// =========================

let player;

let camera;

let keys = {};

let yaw = 0;
let pitch = 0;

let speed = 0.15;


// =========================
// START
// =========================

export function startGame(scene, cam){

camera = cam;


// =========================
// WORLD
// =========================

const ground = new THREE.Mesh(

    new THREE.PlaneGeometry(
        500,
        500
    ),

    new THREE.MeshStandardMaterial({
        color:0x2f8f3a
    })

);


ground.rotation.x =
-Math.PI/2;


scene.add(
    ground
);



// =========================
// PLAYER
// =========================

player = new THREE.Mesh(

    new THREE.BoxGeometry(
        1,
        2,
        1
    ),

    new THREE.MeshStandardMaterial({
        color:0x00ff99
    })

);


player.position.set(
    0,
    1,
    0
);


scene.add(
    player
);



// Kamera hinter Spieler

camera.position.set(
    0,
    3,
    6
);



// =========================
// INPUT
// =========================

window.addEventListener(
"keydown",
(e)=>{
    keys[e.key.toLowerCase()] = true;
});


window.addEventListener(
"keyup",
(e)=>{
    keys[e.key.toLowerCase()] = false;
});



// =========================
// MOUSE LOOK
// =========================

document.body.addEventListener(
"click",
()=>{

document.body.requestPointerLock();

});


document.addEventListener(
"mousemove",
(e)=>{

if(document.pointerLockElement){

yaw -= e.movementX * 0.002;

pitch -= e.movementY * 0.002;


pitch = Math.max(
-1.2,
Math.min(
1.2,
pitch
)
);


}

});


}



// =========================
// UPDATE
// =========================

export function updateGame(delta){


if(!player) return;



// Bewegung

let move =
new THREE.Vector3();


if(keys["w"])
move.z -= 1;

if(keys["s"])
move.z += 1;

if(keys["a"])
move.x -= 1;

if(keys["d"])
move.x += 1;



if(move.length()>0){

move.normalize();


move.applyAxisAngle(
new THREE.Vector3(0,1,0),
yaw
);


player.position.addScaledVector(
move,
speed
);

}


// =========================
// CAMERA FOLLOW
// =========================


const offset =
new THREE.Vector3(
0,
3,
6
);


offset.applyAxisAngle(
new THREE.Vector3(0,1,0),
yaw
);


camera.position.copy(
player.position
)
.add(offset);



camera.rotation.order =
"YXZ";


camera.rotation.y =
yaw;


camera.rotation.x =
pitch;



}
