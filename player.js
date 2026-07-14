// ==========================
// player.js
// Teil 1
// ==========================

// Szene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Kamera (wird später in camera.js gesteuert)
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.getElementById("game").appendChild(renderer.domElement);

// Licht
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(20, 30, 20);
sun.castShadow = true;
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// Boden
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
        color: 0x44aa44
    })
);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Spieler
const player = new THREE.Group();
scene.add(player);

// Material
const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa
});

// Körper
const body = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1.6, 0.6),
    bodyMaterial
);
body.castShadow = true;
player.add(body);

// Kopf
const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    bodyMaterial
);
head.position.y = 1.15;
head.castShadow = true;
player.add(head);

// Linker Arm
const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 1, 0.25),
    bodyMaterial
);
leftArm.position.set(-0.7, 0.2, 0);
player.add(leftArm);

// Rechter Arm
const rightArm = leftArm.clone();
rightArm.position.x = 0.7;
player.add(rightArm);

// Linkes Bein
const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 1.2, 0.3),
    bodyMaterial
);
leftLeg.position.set(-0.22, -1.4, 0);
player.add(leftLeg);

// Rechtes Bein
const rightLeg = leftLeg.clone();
rightLeg.position.x = 0.22;
player.add(rightLeg);

player.position.y = 2;
// ==========================
// player.js
// Teil 2
// ==========================

// Tasteneingaben
const keys = {};

window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Bewegung
let moveSpeed = 0.08;
let runSpeed = 0.14;

let walkTime = 0;

function updatePlayer() {

    let speed = keys["shift"] ? runSpeed : moveSpeed;

    let moving = false;

    if (keys["w"]) {
        player.position.z -= speed;
        moving = true;
    }

    if (keys["s"]) {
        player.position.z += speed;
        moving = true;
    }

    if (keys["a"]) {
        player.position.x -= speed;
        moving = true;
    }

    if (keys["d"]) {
        player.position.x += speed;
        moving = true;
    }

    // Laufanimation
    if (moving) {

        walkTime += 0.18;

        leftArm.rotation.x  =  Math.sin(walkTime) * 0.8;
        rightArm.rotation.x = -Math.sin(walkTime) * 0.8;

        leftLeg.rotation.x  = -Math.sin(walkTime) * 0.8;
        rightLeg.rotation.x =  Math.sin(walkTime) * 0.8;

    } else {

        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;

    }

}

// Fenstergröße ändern
window.addEventListener("resize", () => {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

});

// Hauptschleife
function animate() {

    requestAnimationFrame(animate);

    updatePlayer();

    renderer.render(scene, camera);

}

animate();
