// ======================
// SCENE & SETUP
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6ba7e6);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false; 
document.body.appendChild(renderer.domElement);

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
// GROSSE RUNDE PLATTFORM (Rot)
// ======================
const platformRadius = 40;
const platformGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 2, 64);
const platformMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -1; 
scene.add(platform);

// ======================
// SCHNELL ROTIERENDER STAB
// ======================
const stickLength = platformRadius * 2; 
const stickWidth = 1.2;
const stickHeight = 0.8; 
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
const playerGeo = new THREE.SphereGeometry(playerRadius, 16, 16); // Chromebook freundlich
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, playerRadius, 20); // Startet hinten auf der Plattform
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
    // Auf der runden Plattform positionieren
    m.position.set(x, 1, -30);
    scene.add(m);
    npcs.push(m);
}

// Erzeuge die 3 NPCs an den alten X-Koordinaten
spawnNPC(-4);
spawnNPC(0);
spawnNPC(4);

// ======================
// STEUERUNG & CAMERA MOUSE SYSTEM (Third Person Fix)
// ======================
let keys = {};
let rx = -0.4; 
let ry = 0;    
const cameraDistance = 9;

// Kamera vorab perfekt hinter dem Spieler ausrichten
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
    renderer.setSize(window.innerWidth, window.innerHeight);
};

// ======================
// TIMER & EVENT SYSTEM (Aus Raum-Code übertragen)
// ======================
let timer = 10; // Auf 10 Sekunden verkürzt zum schnelleren Testen
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
        // NPCs laufen vorwärts über die Plattform
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
        // NPCs weichen wieder zurück
        npcs.forEach(n => { n.position.z -= 0.4; });

        if (step > 60) {
            clearInterval(back);
            timerUI.innerText = "EVENT FINISHED";
        }
    }, 30);
}

// ======================
// KOLLISIONS-LOGIK (Stab trifft Kugel)
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
            const speedMultiplier = 0.2 + (distanceFromCenter / halfLength) * 0.8;

            externalForce.x = pushDir.x * speedMultiplier;
            externalForce.y = 0.22; 
            externalForce.z = pushDir.z * speedMultiplier;
        }
    }
}

// ======================
// GAME LOOP
// ======================
const moveSpeed = 0.15;

function update() {
    // Stab kontinuierlich rotieren lassen
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

    externalForce.x *= 0.96;
    externalForce.y -= gravity; 
    externalForce.z *= 0.96;

    player.position.x += velocity.x + externalForce.x;
    player.position.y += externalForce.y;
    player.position.z += velocity.z + externalForce.z;

    // Plattformgrenzen-Check (Bodenkontakt)
    const playerDistanceFromCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    
    if (playerDistanceFromCenter <= platformRadius) {
        if (player.position.y < playerRadius) {
            player.position.y = playerRadius;
            externalForce.y = 0; 
            canJump = true; 
        }
    } else {
        canJump = false; // Im freien Fall kann man nicht springen
    }

    checkStickCollision();

    // Sturz von der Plattform (Rausgeflogen)
    if (player.position.y < -20 && !isDead) {
        isDead = true;
        setTimeout(() => {
            player.position.set(0, playerRadius, 20);
            velocity.set(0, 0, 0);
            externalForce.set(0, 0, 0);
            isDead = false;
            canJump = true;
        }, 1200);
    }

    // Kamera-Nachführung hinter der Kugel (Dritte Person)
    const targetCamX = player.position.x + cameraDistance * Math.sin(ry) * Math.cos(rx);
    const targetCamY = player.position.y - cameraDistance * Math.sin(rx) + 0.5;
    const targetCamZ = player.position.z + cameraDistance * Math.cos(ry) * Math.cos(rx);

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;

    camera.lookAt(player.position.x, player.position.y, player.position.z);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

animate();

// Event-Timer starten
startEventTimer();
