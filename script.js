// ======================
// FALL GUYS EVENT ENGINE
// ======================
const timerUI = document.getElementById("timer-box");
const statusUI = document.getElementById("status-box");
const banner = document.getElementById("banner");

let roundTime = 25; 
let gameStarted = false;
let aliveCount = 4;
const moveSpeed = 0.15;
let clock = new THREE.Clock();

function showFallGuysBanner(text, type = "") {
    banner.innerText = text;
    banner.className = "big-banner show-banner " + type;
    setTimeout(() => { banner.className = "big-banner " + type; }, 3000);
}

// Start-Ablauf beim Laden
setTimeout(() => { showFallGuysBanner("Überlebe den Stab!"); }, 1000);

let gameTimer = setInterval(() => {
    if (roundTime > 0) {
        roundTime--;
        timerUI.innerText = "Zeit: " + roundTime + "s";
    } else {
        clearInterval(gameTimer);
        if (!isDead) {
            showFallGuysBanner("Qualifiziert!", "");
            stickRotationSpeed = 0; // Feierabend
        }
    }
}, 1000);

// Loop-Verarbeitung
function updateGame() {
    slimeUniforms.uTime.value = clock.getElapsedTime() * 2.0;
    stick.rotation.y += stickRotationSpeed;

    // --- 1. SPIELER-PHYSIK ---
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
        externalForce.set(externalForce.x * 0.5, -0.05, externalForce.z * 0.5);
    } else {
        externalForce.set(externalForce.x * 0.96, externalForce.y - gravity, externalForce.z * 0.96);
    }

    player.position.add(velocity).add(externalForce);

    // Plattform-Boden-Check für Spieler
    if (Math.sqrt(player.position.x**2 + player.position.z**2) <= platformRadius) {
        if (player.position.y < playerRadius) {
            player.position.y = playerRadius; externalForce.y = 0; canJump = true;
        }
    } else { canJump = false; }

    handleStickCollision(player.position, playerRadius, externalForce);

    // Schleim-Ausscheiden für Spieler
    if (player.position.y <= -24.5 && !isDead) {
        isDead = true;
        aliveCount--;
        showFallGuysBanner("Ausgeschieden!", "eliminated");
    }

    // --- 2. NPC KI-PHYSIK (Weichen dem Stab minimal aus, fliegen aber physikalisch mit) ---
    npcs.forEach(n => {
        if (n.isOut) return;

        // Simpelste KI-Ausweichbewegung
        let npcMove = new THREE.Vector3(0, 0, 0);
        if (Math.random() > 0.5) {
            npcMove.set(Math.sin(stick.rotation.y) * 0.05, 0, Math.cos(stick.rotation.y) * 0.05);
            n.mesh.position.add(npcMove);
        }

        n.extForce.y -= gravity;
        n.extForce.x *= 0.96; n.extForce.z *= 0.96;

        if (n.mesh.position.y < -23) n.extForce.y = -0.05;
        n.mesh.position.add(n.extForce);

        // Boden-Check für NPCs
        if (Math.sqrt(n.mesh.position.x**2 + n.mesh.position.z**2) <= platformRadius) {
            if (n.mesh.position.y < playerRadius) {
                n.mesh.position.y = playerRadius; n.extForce.y = 0;
            }
        }

        handleStickCollision(n.mesh.position, playerRadius, n.extForce);

        // NPC fällt in Schleim
        if (n.mesh.position.y <= -24.5) {
            n.isOut = true;
            aliveCount--;
            scene.remove(n.mesh);
        }
    });

    // UI updaten
    statusUI.innerText = "Überlebende: " + aliveCount + " / 4";

    // --- 3. KAMERA-STEADY-CAM ---
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
    if(renderer) renderer.render(scene, camera);
}

if(renderer) animateGame();
