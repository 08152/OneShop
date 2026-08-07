// ======================
// 3D ENGINE & PHYSIK
// ======================
const scene = new THREE.Scene();

// Himmel erstellen aus shader.js
const skyGeo = new THREE.SphereGeometry(400, 32, 15);
const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

// Rote Plattform
const platformRadius = 40;
const platformGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 2, 64);
const floorMat = new THREE.ShaderMaterial({
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader
});
const platform = new THREE.Mesh(platformGeo, floorMat);
platform.position.y = -1; 
scene.add(platform);

// Schleim-Boden
const slimeGeo = new THREE.PlaneGeometry(800, 800, 2, 2);
const slimeMat = new THREE.ShaderMaterial({
    vertexShader: slimeVertexShader,
    fragmentShader: slimeFragmentShader,
    uniforms: slimeUniforms
});
const slimeFloor = new THREE.Mesh(slimeGeo, slimeMat);
slimeFloor.position.y = -25; 
slimeFloor.rotation.x = -Math.PI / 2; 
scene.add(slimeFloor);

// Hoher Stab
const stickLength = platformRadius * 2; 
const stickWidth = 1.5;
const stickHeight = 12.0; 
const stickGeo = new THREE.BoxGeometry(stickLength, stickHeight, stickWidth);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.set(0, stickHeight / 2, 0); 
scene.add(stick);
let stickRotationSpeed = 0.035; 

// Spieler (Kugel)
const playerRadius = 1.2;
const playerGeo = new THREE.SphereGeometry(playerRadius, 16, 16); 
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, playerRadius, 20); 
scene.add(player);

let velocity = new THREE.Vector3(0, 0, 0);
let externalForce = new THREE.Vector3(0, 0, 0); 
let gravity = 0.015;
let jumpForce = 0.42; 
let canJump = true;
let isDead = false;

// NPCs als physikalische Kumpels aufbauen
const npcMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.4 });
let npcs = [];

function spawnNPC(x, z) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(playerRadius, 16, 16), npcMat);
    m.position.set(x, playerRadius, z);
    scene.add(m);
    npcs.push({
        mesh: m,
        extForce: new THREE.Vector3(),
        isOut: false
    });
}
spawnNPC(-10, -10);
spawnNPC(10, -15);
spawnNPC(-15, 10);

// Steuerung & Kamera-Variablen
let keys = {};
let rx = -0.4, ry = 0;    
const cameraDistance = 12;

window.onkeydown = (e) => { 
    keys[e.key.toLowerCase()] = true; 
    if (e.code === "Space" && canJump && !isDead) {
        externalForce.y = jumpForce;
        canJump = false;
    }
};
window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };
document.body.onclick = () => { document.body.requestPointerLock(); };
window.onmousemove = (e) => {
    if (document.pointerLockElement) {
        ry -= e.movementX * 0.0025;
        rx -= e.movementY * 0.0025;
        rx = Math.max(-0.6, Math.min(0.2, rx));
    }
};
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

// Kollisionsberechnung für Box vs Kugel
function handleStickCollision(targetPos, radius, targetExtForce) {
    if (targetPos.y - radius < stick.position.y + stickHeight / 2 && 
        targetPos.y + radius > stick.position.y - stickHeight / 2) {
        
        const angle = stick.rotation.y;
        const localX = targetPos.x * Math.cos(-angle) - targetPos.z * Math.sin(-angle);
        const localZ = targetPos.x * Math.sin(-angle) + targetPos.z * Math.cos(-angle);

        if (Math.abs(localX) < (stickLength / 2) + radius && Math.abs(localZ) < (stickWidth / 2) + radius) {
            const pushDir = new THREE.Vector3(0, 0, Math.sign(localZ)).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            const speedMultiplier = 0.3 + (Math.abs(localX) / (stickLength / 2)) * 0.9;
            targetExtForce.x = pushDir.x * speedMultiplier;
            targetExtForce.y = 0.15; 
            targetExtForce.z = pushDir.z * speedMultiplier;
        }
    }
}
