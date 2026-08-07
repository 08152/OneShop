// ======================
// 1. 3D ENGINE & WELTBAU
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

// Weißes Hilfsraster
const grid = new THREE.GridHelper(platformRadius * 2, 40, 0xffffff, 0x990000);
grid.position.y = 0.01;
scene.add(grid);

// Grüner Schleim-Boden
const slimeGeo = new THREE.PlaneGeometry(800, 800);
const slimeMat = new THREE.MeshBasicMaterial({ color: 0x00cc11 });
const slimeFloor = new THREE.Mesh(slimeGeo, slimeMat);
slimeFloor.position.y = -25; 
slimeFloor.rotation.x = -Math.PI / 2; 
scene.add(slimeFloor);

// Hoher, rotierender Stab
const stickLength = platformRadius * 2; 
const stickWidth = 1.5;
const stickHeight = 12.0; 
const stickGeo = new THREE.BoxGeometry(stickLength, stickHeight, stickWidth);
const stickMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
const stick = new THREE.Mesh(stickGeo, stickMat);
stick.position.set(0, stickHeight / 2, 0); 
scene.add(stick);
let stickRotationSpeed = 0.035; 

// Spieler (Gelbe Kugel)
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

// NPCs (Blaue Kugeln)
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

// Steuerung & Kamera-Winkel
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

// ======================
// 2. FALL GUYS EVENT LOGIK
// ======================
const timerUI = document.getElementById("timer-box");
const statusUI = document.getElementById("status-box");
const banner = document.getElementById("banner");

let roundTime = 25; 
let aliveCount = 4;
const moveSpeed = 0.15;

function showFallGuysBanner(text, type = "") {
    banner.innerText = text;
    banner.className = "big-banner show-banner " + type;
    setTimeout(() => { banner.className = "big-banner " + type; }, 3000);
}

// Rundenankündigung direkt beim Laden
setTimeout(() => { showFallGuysBanner("Überlebe den Stab!"); }, 500);

let gameTimer = setInterval(() => {
    if (roundTime > 0) {
        roundTime--;
        timerUI.innerText = "Zeit: " + roundTime + "s";
    } else {
        clearInterval(gameTimer);
        if (!isDead) {
            showFallGuysBanner("Qualifiziert!", "");
            stickRotationSpeed = 0; // Stoppt den Stab beim Rundensieg
        }
    }
}, 1000);

// ======================
// 3. HAUPTSCHLEIFE (GAMELOOP)
// ======================
function updateGame() {
    stick.rotation.y += stickRotationSpeed;

    // Spieler-Bewegung
    let moveX = 0, moveZ = 0;
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
        velocity.x *= 0.85; velocity.z *= 0.85;
    }

    if (player.position.y < -23) {
        externalForce.set(externalForce.x * 0.5, -0.05, externalForce.z * 0.5); // Bremsen im Schleim
    } else {
        externalForce.set(externalForce.x * 0.96, externalForce.y - gravity, externalForce.z * 0.96);
    }

    player.position.add(velocity).add(externalForce);

    // Auf Plattform landen
    if (Math.sqrt(player.position.x**2 + player.position.z**2) <= platformRadius) {
        if (player.position.y < playerRadius) {
            player.position.y = playerRadius; externalForce.y = 0; canJump = true;
        }
    } else { canJump = false; }

    handleStickCollision(player.position, playerRadius, externalForce);

    // Im Schleim gelandet
    if (player.position.y <= -24.5 && !isDead) {
        isDead = true;
        aliveCount--;
        showFallGuysBanner("Ausgeschieden!", "eliminated");
    }

    // NPC-Gegner verarbeiten
    npcs.forEach(n => {
        if (n.isOut) return;

        let npcMove = new THREE.Vector3(0, 0, 0);
        if (Math.random() > 0.6) {
            npcMove.set((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1);
            n.mesh.position.add(npcMove);
        }

        n.extForce.y -= gravity;
        n.extForce.x *= 0.96; n.extForce.z *= 0.96;

        if (n.mesh.position.y < -23) n.extForce.y = -0.05;
        n.mesh.position.add(n.extForce);

        if (Math.sqrt(n.mesh.position.x**2 + n.mesh.position.z**2) <= platformRadius) {
            if (n.mesh.position.y < playerRadius) {
                n.mesh.position.y = playerRadius; n.extForce.y = 0;
            }
        }

        handleStickCollision(n.mesh.position, playerRadius, n.extForce);

        if (n.mesh.position.y <= -24.5) {
            n.isOut = true;
            aliveCount--;
            scene.remove(n.mesh);
        }
    });

    statusUI.innerText = "Überlebende: " + aliveCount + " / 4";

    // Dritte-Person-Kamera nachführen
    const targetCamX = player.position.x + cameraDistance * Math.sin(ry) * Math.cos(rx);
    const targetCamY = player.position.y - cameraDistance * Math.sin(rx) + 0.5;
    const targetCamZ = player.position.z + cameraDistance * Math.cos(ry) * Math.cos(rx);

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
}

function animateGame() {
    requestAnimationFrame(animateGame);
    updateGame();
    renderer.render(scene, camera);
}

animateGame();
