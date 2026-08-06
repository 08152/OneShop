// ======================
// SCENE & SETUP
// ======================
const scene = new THREE.Scene();
// Heller blauer Himmel als Hintergrundfarbe
scene.background = new THREE.Color(0x6ba7e6);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Schatten deaktiviert für maximale Performance auf dem Chromebook
renderer.shadowMap.enabled = false; 
document.body.appendChild(renderer.domElement);

// ======================
// LIGHTING (Aus dem funktionierenden Code)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

// ======================
// GROSSE RUNDE PLATTFORM (Rot)
// ======================
const platformRadius = 60;
// Zylinder erzeugt eine perfekte runde Plattform
const platformGeo = new THREE.CylinderGeometry(platformRadius, platformRadius, 2, 64);
// Rotes StandardMaterial (Sicher für Chromebooks)
const platformMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.6 });
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.y = -1; // Oberfläche genau auf Höhe 0 setzen
scene.add(platform);

// Ein helleres Gitter auf der Plattform für das Geschwindigkeitsgefühl
const grid = new THREE.GridHelper(platformRadius * 2, 40, 0xffffff, 0x990000);
grid.position.y = 0.01;
scene.add(grid);

// ======================
// SPIELER (Kugel)
// ======================
const playerRadius = 1.2;
const playerGeo = new THREE.SphereGeometry(playerRadius, 32, 32);
// Kontrastierende gelbe Kugel, damit man das Rollen gut sieht
const playerMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4 });
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, playerRadius, 0);
scene.add(player);

// ======================
// STEUERUNG & MAUS (Third Person)
// ======================
let keys = {};
let rx = -0.3; // Vertikaler Winkel (Blick leicht nach unten)
let ry = 0;    // Horizontaler Drehwinkel
const cameraDistance = 8;

window.onkeydown = (e) => { keys[e.key.toLowerCase()] = true; };
window.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

document.body.onclick = () => { document.body.requestPointerLock(); };

window.onmousemove = (e) => {
    if (document.pointerLockElement) {
        ry -= e.movementX * 0.0025;
        rx -= e.movementY * 0.0025;
        // Begrenzung, damit die Kamera nicht unter den Boden oder über Kopf flippt
        rx = Math.max(-0.6, Math.min(0.2, rx));
    }
};

// Fenstergröße anpassen
window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

// ======================
// GAME LOOP & PHYSIK
// ======================
const moveSpeed = 0.15;

function update() {
    let moveX = 0;
    let moveZ = 0;

    // Bewegung relativ zur Kamera-Blickrichtung (ry) berechnen
    if (keys.w) { moveX += Math.sin(ry); moveZ += Math.cos(ry); }
    if (keys.s) { moveX -= Math.sin(ry); moveZ -= Math.cos(ry); }
    if (keys.a) { moveX += Math.sin(ry + Math.PI / 2); moveZ += Math.cos(ry + Math.PI / 2); }
    if (keys.d) { moveX -= Math.sin(ry + Math.PI / 2); moveZ -= Math.cos(ry + Math.PI / 2); }

    if (moveX !== 0 || moveZ !== 0) {
        // Normalisieren für gleichmäßige Geschwindigkeit bei diagonalem Laufen
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const stepX = (moveX / length) * moveSpeed;
        const stepZ = (moveZ / length) * moveSpeed;

        player.position.x += stepX;
        player.position.z += stepZ;

        // ECHTES 3D-ROLLEN: Kugel rotieren lassen basierend auf Bewegung
        player.rotation.z -= stepX / playerRadius;
        player.rotation.x += stepZ / playerRadius;
    }

    // Runde Plattformgrenze einhalten (Kugel kann nicht herunterfallen)
    const distanceFromCenter = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
    if (distanceFromCenter > platformRadius - playerRadius) {
        const angle = Math.atan2(player.position.z, player.position.x);
        player.position.x = Math.cos(angle) * (platformRadius - playerRadius);
        player.position.z = Math.sin(angle) * (platformRadius - playerRadius);
    }

    // THIRD PERSON KAMERA-BERECHNUNG: Immer hinter der Kugel positionieren
    const targetCamX = player.position.x + cameraDistance * Math.sin(ry) * Math.cos(rx);
    const targetCamY = player.position.y - cameraDistance * Math.sin(rx) + 0.5;
    const targetCamZ = player.position.z + cameraDistance * Math.cos(ry) * Math.cos(rx);

    // Kamera weich der Kugel folgen lassen (Lerp-Effekt)
    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;

    // Kamera blickt immer auf die Mitte der Kugel
    camera.lookAt(player.position.x, player.position.y, player.position.z);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Spiel starten
animate();
