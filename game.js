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
// SCHNELL ROTIERENDER STAB (Flacher für Sprünge)
// ======================
const stickLength = platformRadius * 2; 
const stickWidth = 1.2;
const stickHeight = 0.8; // Etwas flacher, damit man gut drüberspringen kann
const stickGeo = new THREE.BoxGeometry(stickLength, stickHeight, stickWidth);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.set(0, stickHeight / 2, 0); 
scene.add(stick);

let stickRotationSpeed = 0.035; // Deutlich SCHNELLER rotiert!

// ======================
// SPIELER (Kugel) & PHYSIK
// ======================
const playerRadius = 1.2;
const playerGeo = new THREE.SphereGeometry(playerRadius, 32, 32);
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, playerRadius, 15); 
scene.add(player);

let velocity = new THREE.Vector3(0, 0, 0);
let externalForce = new THREE.Vector3(0, 0, 0); 
let gravity = 0.015;
let jumpForce = 0.45; // Stärke des Sprungs
let canJump = true;
let isDead = false;

// ======================
// STEUERUNG (Inklusive Jump & Space)
// ======================
let keys = {};
let rx = -0.3; 
let ry = 0;    
const cameraDistance = 8;

window.onkeydown = (e) => { 
    keys[e.key.toLowerCase()] = true; 
    
    // Sprung auslösen bei Leertaste (e.code für präzise Erkennung)
    if (e.code === "Space" && canJump && !isDead) {
        externalForce.y = jumpForce;
        canJump = false;
    }
};

window.onkeyup = (e) => { 
    keys[e.key.toLowerCase()] = false; 
};

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
// KOLLISIONS-LOGIK (Stangen-Treffer)
// ======================
function checkStickCollision() {
    if (isDead) return;

    // Prüfen, ob die Kugel vertikal auf Höhe des Stabes ist (Höhen-Check)
    if (player.position.y - playerRadius < stick.position.y + stickHeight / 2 && 
        player.position.y + playerRadius > stick.position.y - stickHeight / 2) {
        
        const angle = stick.rotation.y;
        
        // Kugel in das lokale Koordinatensystem der Stange umrechnen
        const localX = player.position.x * Math.cos(-angle) - player.position.z * Math.sin(-angle);
        const localZ = player.position.x * Math.sin(-angle) + player.position.z * Math.cos(-angle);

        const halfLength = stickLength / 2;
        const halfWidth = stickWidth / 2;

        // Hitbox-Überprüfung
        if (Math.abs(localX) < halfLength + playerRadius && Math.abs(localZ) < halfWidth + playerRadius) {
            
            // Abstoß-Richtung (Vektor senkrecht von der Stangenkante weg)
            const pushDir = new THREE.Vector3(0, 0, Math.sign(localZ));
            pushDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            // Zentrifugalkraft: Außen wird man härter getroffen als innen
            const distanceFromCenter = Math.abs(localX);
            const speedMultiplier = 0.2 + (distanceFromCenter / halfLength) * 0.8;

            // Wucht des Aufpralls zuweisen (Wegschleudern + leichter Aufwärts-Impuls)
            externalForce.x = pushDir.x * speedMultiplier;
            externalForce.y = 0.2; 
            externalForce.z = pushDir.z * speedMultiplier;
        }
    }
}

// ======================
// GAME LOOP
// ======================
const moveSpeed = 0.15;

function update() {
    // 1. Stab schnell rotieren lassen
    stick.rotation.y += stickRotationSpeed;

    // 2. Bewegung berechnen
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

        // Roll-Animation
        player.rotation.z -= velocity.x / playerRadius;
        player.rotation.x += velocity.z / playerRadius;
    } else {
        velocity.x *= 0.85;
        velocity.z *= 0.85;
    }

    // 3. Kräfte & Schwerkraft anwenden
    externalForce.x *= 0.96;
    externalForce.y -= gravity; // Schwerkraft zieht Kugel nach unten
    externalForce.z *= 0.96;

    player.position.x += velocity.x + externalForce.x;
    player.position.y += externalForce.y;
    player.position.z += velocity.z + externalForce.z;

    // 4. Bodenkontakt auf der Plattform prüfen
    const playerDistanceFromCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    
    if (playerDistanceFromCenter <= platformRadius) {
        if (player.position.y < playerRadius) {
            player.position.y = playerRadius;
            externalForce.y = 0; 
            canJump = true; // Sprung wieder erlauben, wenn man landet
        }
    } else {
        // Wenn man über den Rand fliegt, verliert man den Bodenkontakt
        canJump = false;
    }

    // Hitbox-Check triggern
    checkStickCollision();

    // 5. Respawn bei Sturz ins Nichts
    if (player.position.y < -20 && !isDead) {
        isDead = true;
        setTimeout(() => {
            player.position.set(0, playerRadius, 15);
            velocity.set(0, 0, 0);
            externalForce.set(0, 0, 0);
            isDead = false;
            canJump = true;
        }, 1200);
    }

    // 6. Kamera-Nachführung
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
