import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.167/build/three.module.js";
import {PointerLockControls} from "https://cdn.jsdelivr.net/npm/three@0.167/examples/jsm/controls/PointerLockControls.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87ceeb);

const camera=new THREE.PerspectiveCamera(
75,
window.innerWidth/window.innerHeight,
0.1,
1000
);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls=new PointerLockControls(camera,document.body);

document.getElementById("info").onclick=()=>{
controls.lock();
};

controls.addEventListener("lock",()=>{
document.getElementById("info").style.display="none";
});

controls.addEventListener("unlock",()=>{
document.getElementById("info").style.display="block";
});

scene.add(controls.getObject());

camera.position.set(0,2,15);

const light=new THREE.DirectionalLight(0xffffff,3);
light.position.set(10,20,10);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff,1));

const floor=new THREE.Mesh(
new THREE.CylinderGeometry(30,30,1,64),
new THREE.MeshStandardMaterial({
color:0x4caf50
})
);
floor.position.y=-0.5;
scene.add(floor);

const pillar=new THREE.Mesh(
new THREE.CylinderGeometry(0.4,0.4,12,32),
new THREE.MeshStandardMaterial({
color:0x555555
})
);
pillar.position.y=6;
scene.add(pillar);

const barMaterial=new THREE.MeshStandardMaterial({
color:0xff0000
});

const bar1=new THREE.Mesh(
new THREE.BoxGeometry(18,0.25,0.25),
barMaterial
);

const bar2=new THREE.Mesh(
new THREE.BoxGeometry(18,0.25,0.25),
barMaterial
);

bar1.position.y=1;
bar2.position.y=2.5;

scene.add(bar1);
scene.add(bar2);

const playerRadius=0.5;

const keys={};

document.addEventListener("keydown",e=>{
keys[e.code]=true;
});

document.addEventListener("keyup",e=>{
keys[e.code]=false;
});

let angle=0;

function animate(){

requestAnimationFrame(animate);

angle+=0.02;

bar1.rotation.y=angle;
bar2.rotation.y=-angle*1.5;

const speed=0.12;

if(controls.isLocked){

if(keys["KeyW"])
controls.moveForward(speed);

if(keys["KeyS"])
controls.moveForward(-speed);

if(keys["KeyA"])
controls.moveRight(-speed);

if(keys["KeyD"])
controls.moveRight(speed);

camera.position.y=2;
}

// Kollision mit den drehenden Stäben

const playerPos=controls.getObject().position;

for(const b of [bar1,bar2]){

const dx=playerPos.x-b.position.x;
const dz=playerPos.z-b.position.z;

const dist=Math.sqrt(dx*dx+dz*dz);

if(dist<9.2 && Math.abs(playerPos.y-b.position.y)<1){

playerPos.set(0,2,15);

alert("Du bist gestorben!");

}

}

renderer.render(scene,camera);

}

animate();

window.addEventListener("resize",()=>{

camera.aspect=window.innerWidth/window.innerHeight;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth,window.innerHeight);

});
