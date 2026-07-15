// ======================================
// MECHA CHAMELEON
// game.js PART 1/3
// ======================================


import * as THREE from 
"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";


// =============================
// GAME VARIABLES
// =============================

let scene;
let camera;


let player;
let character = {};


let keys = {};

let yaw = 0;
let pitch = 0;


let speed = 0.15;



// =============================
// START GAME
// =============================

export function startGame(world, cam){


scene = world;

camera = cam;



// =============================
// CREATE PLAYER
// =============================


createCharacter();



// =============================
// INPUT
// =============================


window.addEventListener(
"keydown",
(e)=>{

keys[e.key.toLowerCase()] = true;


}
);


window.addEventListener(
"keyup",
(e)=>{

keys[e.key.toLowerCase()] = false;


}
);



// =============================
// MOUSE LOOK
// =============================


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


pitch =
Math.max(
-1.2,
Math.min(
1.2,
pitch
)
);


}


});



// Boden

createWorld();


}





// =============================
// CHARACTER SYSTEM
// =============================

function createCharacter(){


const material =
new THREE.MeshStandardMaterial({

color:0x00ff99

});



// ROOT

character.root =
new THREE.Group();

player =
character.root;



// BODY

character.body =
new THREE.Mesh(

new THREE.BoxGeometry(
1,
1.5,
0.6
),

material

);


character.body.position.y=2;



// HEAD

character.head =
new THREE.Mesh(

new THREE.SphereGeometry(
0.45,
16,
16
),

material

);


character.head.position.y=3.2;




// ARM LEFT

character.armLeft =
new THREE.Mesh(

new THREE.BoxGeometry(
0.25,
1,
0.25
),

material

);


character.armLeft.position.set(
-0.8,
2,
0
);



// ARM RIGHT

character.armRight =
character.armLeft.clone();


character.armRight.position.x=0.8;




// LEG LEFT

character.legLeft =
new THREE.Mesh(

new THREE.BoxGeometry(
0.3,
1,
0.3
),

material

);


character.legLeft.position.set(
-0.3,
0.8,
0
);



// LEG RIGHT

character.legRight =
character.legLeft.clone();


character.legRight.position.x=0.3;




// ADD PARTS

character.root.add(
character.body,
character.head,
character.armLeft,
character.armRight,
character.legLeft,
character.legRight
);



scene.add(
character.root
);



character.root.position.set(
0,
0,
0
);


}
// ======================================
// MECHA CHAMELEON
// game.js PART 3/3
// ======================================


// =============================
// WORLD
// =============================

function createWorld(){

const ground = new THREE.Mesh(

new THREE.PlaneGeometry(
500,
500
),

new THREE.MeshStandardMaterial({
color:0x328a3a
})

);


ground.rotation.x =
-Math.PI/2;


scene.add(ground);



}



// =============================
// PHYSICS
// =============================

let velocityY = 0;

let gravity = -0.02;


let grounded = false;




function physics(){


velocityY += gravity;


player.position.y += velocityY;



if(player.position.y < 0){


player.position.y = 0;


velocityY = 0;


grounded = true;


}



}




// =============================
// WALK ANIMATION
// =============================

let walkTime = 0;


function animateCharacter(){


if(
keys["w"] ||
keys["a"] ||
keys["s"] ||
keys["d"]
){


walkTime +=0.15;



character.legLeft.rotation.x =
Math.sin(walkTime)*0.7;


character.legRight.rotation.x =
-Math.sin(walkTime)*0.7;



character.armLeft.rotation.x =
-Math.sin(walkTime)*0.5;


character.armRight.rotation.x =
Math.sin(walkTime)*0.5;



}

else{


character.legLeft.rotation.x *=0.8;

character.legRight.rotation.x *=0.8;

character.armLeft.rotation.x *=0.8;

character.armRight.rotation.x *=0.8;


}



}




// =============================
// CHAMELEON CAMOUFLAGE
// =============================

let invisible = false;


window.addEventListener(
"keydown",
(e)=>{


if(e.key.toLowerCase()==="c"){


invisible =
!invisible;



player.traverse(
(obj)=>{


if(obj.material){


obj.material.transparent=true;


obj.material.opacity =
invisible ? 0.15 : 1;


}


});



}



});





// =============================
// MAIN UPDATE
// =============================

export function updateGame(delta){


if(!player)
return;



movePlayer();


physics();


animateCharacter();


updateCamera();



}
