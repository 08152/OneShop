// ======================
// 3D ENGINE & WELTBAU
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ba7e6); // Hellblauer Himmel

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

// Helle Beleuchtung
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

// Große rote Plattform
const platformRadius = 40;
const platformGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 2, 64);
const platformMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -1; 
scene.add(platform);

// Weißes Raster auf der Plattform für die Orientierung
const grid = new THREE.GridHelper(platformRadius * 2, 40, 0xffffff, 0x990000);
grid.position.y = 0.01;
scene.add(grid);

// Grüner Schleim-Boden weit unten im Abgrund
const slimeGeo = new THREE.PlaneGeometry(800, 800);
const slimeMat = new THREE.MeshBasicMaterial({ color: 0x00cc11 });
const slimeFloor = new THREE.Mesh(slimeGeo, slimeMat);
slimeFloor.position.y = -25; 
slimeFloor.rotation.x = -Math.PI / 2; 
scene.add(slimeFloor);

// Hoher, sich drehender Stab im Zentrum
const stickLength = platformRadius * 2; 
const stickWidth = 1.5;
const stickHeight = 12.0; 
const stickGeo = new THREE.BoxGeometry(stickLength, stickHeight, stickWidth);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.set(0, stickHeight / 2, 0); 
scene.add(stick);
let stickRotationSpeed = 0.035; 

// Spieler (Die goldene Kugel)
const playerRadius = 1.2;
const playerGeo = new THREE.SphereGeometry(playerRadius, 16, 16); 
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, playerRadius, 20); 
scene.add(player);

// Physik-Variablen für Kugel und Stangenschubser
let velocity = new THREE.Vector3(0, 0, 0);
let externalForce = new THREE.Vector3(0, 0, 0); 
let gravity = 0.015;
let jumpForce = 0.42; 
let canJump = true;
let isDead = false;

// NPCs (Die blauen Gegner-Kugeln)
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

// Eingabe & Kamera-Winkel
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

// Kollisionsberechnung für den rotierenden Stab
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
