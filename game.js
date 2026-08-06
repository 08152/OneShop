// ======================
// SCENE & SETUP
// ======================
const scene = new THREE.Scene();

// Himmel mit Shadern aus shader.js erstellen
const skyGeo = new THREE.SphereGeometry(400, 32, 15);
const skyMat = new THREE.ShaderMaterial({
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let renderer;
try {
    renderer = new THREE.WebGLRenderer({ 
        antialias: false,        
        powerPreference: "high-performance",
        precision: "mediump"     
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false; 
    document.body.appendChild(renderer.domElement);
} catch (e) {
    alert("WebGL wird nicht unterstützt.");
}

// Socket-Verbindung (Render-kompatibel)
const socket = io(window.location.origin, {
    transports: ['polling', 'websocket']
});

// ======================
// LIGHTING
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

// ======================
// GROSSE RUNDE PLATTFORM (Nutzt floor-Shader)
// ======================
const platformRadius = 40;
const platformGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 2, 64);
const floorMat = new THREE.ShaderMaterial({
    vertexShader: floorVertexShader,
    fragmentShader: floorFragmentShader
});
const platform = new THREE.Mesh(platformGeo, floorMat);
platform.position.y = -1; 
scene.add(platform);

// ======================
// SCHLEIM-BODEN IM ABGRUND (Nutzt slime-Shader)
// ======================
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

// ======================
// HOHER ROTIERENDER STAB
// ======================
const stickLength = platformRadius * 2; 
const stickWidth = 1.5;
const stickHeight = 12.0; 
const stickGeo = new THREE.BoxGeometry(stickLength, stickHeight, stickWidth);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.set(0, stickHeight / 2, 0); 
scene.add(stick);

let stickRotationSpeed = 0.035; 

// ======================
// SPIELER (Kugel) & PHYSIK
// ======================
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

// ======================
// NPCs AUS DEM RAUM-EVENT
// ======================
const npcMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
let npcs = [];

function spawnNPC(x) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), npcMat);
    m.position.set(x, 1, -30);
    scene.add(m);
    npcs.push(m);
}
spawnNPC(-4);
spawnNPC(0);
spawnNPC(4);

// ======================
// STEUERUNG & CAMERA MOUSE SYSTEM
// ======================
let keys = {};
let rx = -0.4; 
let ry = 0;    
const cameraDistance = 12;

camera.position.x = player.position.x + cameraDistance * Math.sin(ry) * Math.cos(rx);
camera.position.y = player.position.y - cameraDistance * Math.sin(rx) + 0.5;
camera.position.z = player.position.z + cameraDistance * Math.cos(ry) * Math.cos(rx);
camera.lookAt(player.position.x, player.position.y, player.position.z);

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
    if(renderer) renderer.setSize(window.innerWidth, window.innerHeight);
};

// ======================
// TIMER & EVENT SYSTEM
// ======================
let timer = 10; 
const timerUI = document.getElementById("timer");
const dialog = document.getElementById("dialog");

function startEventTimer() {
    let t = setInterval(() => {
        timer--;
        timerUI.innerText = "START IN: " + timer;
        if (timer <= 0) {
            clearInterval(t);
            cutscene();
        }
    }, 1000);
}

function cutscene() {
    timerUI.innerText = "EVENT START";
    let step = 0;
    let move = setInterval(() => {
        step++;
        npcs.forEach(n => { n.position.z += 0.4; });
        if (step > 60) {
            clearInterval(move);
            say();
        }
    }, 30);
}

function say() {
    dialog.style.opacity = 1;
    dialog.innerText = "🔊 Hallo Test!";
    setTimeout(() => {
        dialog.style.opacity = 0;
        endEvent();
    }, 2500);
}

function endEvent() {
    let step = 0;
    let back = setInterval(() => {
        step++;
        npcs.forEach(n => { n.position.z -= 0.4; });
        if (step > 60) {
            clearInterval(back);
            timerUI.innerText = "EVENT FINISHED";
        }
    }, 30);
}

// ======================
// KOLLISIONS-LOGIK
// ======================
function checkStickCollision() {
    if (isDead) return;

    if (player.position.y - playerRadius < stick.position.y + stickHeight / 2 && 
        player.position.y + playerRadius > stick.position.y - stickHeight / 2) {
        
        const angle = stick.rotation.y;
        const localX = player.position.x * Math.cos(-angle) - player.position.z * Math.sin(-angle);
        const localZ = player.position.x * Math.sin(-angle) + player.position.z * Math.cos(-angle);

        const halfLength = stickLength / 2;
        const halfWidth = stickWidth / 2;

        if (Math.abs(localX) < halfLength + playerRadius && Math.abs(localZ) < halfWidth + playerRadius) {
            const pushDir = new THREE.Vector3(0, 0, Math.sign(localZ));
            pushDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            const distanceFromCenter = Math.abs(localX);
            const speedMultiplier = 0.3 + (distanceFromCenter / halfLength) * 0.9;

            externalForce.x = pushDir.x * speedMultiplier;
            externalForce.y = 0.15; 
            externalForce.z = pushDir.z * speedMultiplier;
        }
    }
}

// ======================
// GAME LOOP
// ======================
const moveSpeed = 0.15;
let clock = new THREE.Clock();

function update() {
    // Nutzt das ausgelagerte slimeUniforms-Objekt
    slimeUniforms.uTime.value = clock.getElapsedTime() * 2.0;

    stick.rotation.y += stickRotationSpeed;

    let moveX = 0;
    let moveZ = 0;

    if (!isDead) {
        if (keys.w) { moveX += Math.sin(ry); moveZ += Math.cos(ry); }
        if (keys.s) { moveX -= Math.sin(ry); moveZ -= Math.cos(ry); }
        if (keys.a) { moveX += Math.sin(ry + Math.PI / 2); moveZ += Math.cos(ry + Math.PI / 2); }
        if (keys.d) { moveX -= Math.sin(ry + Math.PI / 2); moveZ -= Math.cos(ry + Math.PI / 2); }
    }

    if (moveX !== 0 || moveZ !== 0) {
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        velocity.x = (moveX / length) * moveSpeed;
        velocity.z = (moveZ / length) * moveSpeed;

        player.rotation.z -= velocity.x / playerRadius;
        player.rotation.x += velocity.z / playerRadius;
    } else {
        velocity.x *= 0.85;
        velocity.z *= 0.85;
    }

    if (player.position.y < -23) {
        externalForce.x *= 0.5;
        externalForce.z *= 0.5;
        externalForce.y = -0.05; 
    } else {
        externalForce.x *= 0.96;
        externalForce.y -= gravity; 
        externalForce.z *= 0.96;
    }

    player.position.x += velocity.x + externalForce.x;
    player.position.y += externalForce.y;
    player.position.z += velocity.z + externalForce.z;

    const playerDistanceFromCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    
    if (playerDistanceFromCenter <= platformRadius) {
        if (player.position.y < playerRadius) {
            player.position.y = playerRadius;
            externalForce.y = 0; 
            canJump = true; 
        }
    } else {
        canJump = false; 
    }

    checkStickCollision();

    if (player.position.y <= -24.5 && !isDead) {
        isDead = true;
        setTimeout(() => {
            player.position.set(0, playerRadius, 20);
            velocity.set(0, 0, 0);
            externalForce.set(0, 0, 0);
            isDead = false;
            canJump = true;
        }, 1500); 
    }

    const targetCamX = player.position.x + cameraDistance * Math.sin(ry) * Math.cos(rx);
    const targetCamY = player.position.y - cameraDistance * Math.sin(rx) + 0.5;
    const targetCamZ = player.position.z + cameraDistance * Math.cos(ry) * Math.cos(rx);

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;

    camera.lookAt(player.position.x, player.position.y + 2, player.position.z); 
}

function animate() {
    requestAnimationFrame(animate);
    update();
if(renderer) renderer.render(scene, camera);
}

if(renderer) animate();
startEventTimer();

