// ==========================
// camera.js
// Korrigierte Version
// ==========================

// Kamerawinkel
let camYaw = 0;
let camPitch = 0.35;

let cameraDistance = 6;
const minDistance = 3;
const maxDistance = 12;

const cameraHeight = 2.5;

// Maus
let mouseDown = false;

renderer.domElement.addEventListener("mousedown", () => {
    mouseDown = true;
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
});

window.addEventListener("mousemove", (e) => {

    if (!mouseDown) return;

    camYaw -= e.movementX * 0.005;
    camPitch -= e.movementY * 0.005;

    camPitch = Math.max(-0.4, Math.min(1.2, camPitch));

});

// Zoom
window.addEventListener("wheel", (e) => {

    cameraDistance += e.deltaY * 0.01;

    cameraDistance = Math.max(
        minDistance,
        Math.min(maxDistance, cameraDistance)
    );

});

// Kamera aktualisieren
function updateCamera() {

    const target = new THREE.Vector3(
        player.position.x,
        player.position.y + cameraHeight,
        player.position.z
    );

    const x =
        target.x +
        Math.sin(camYaw) * cameraDistance;

    const z =
        target.z +
        Math.cos(camYaw) * cameraDistance;

    const y =
        target.y +
        Math.sin(camPitch) * cameraDistance;

    camera.position.lerp(
        new THREE.Vector3(x, y, z),
        0.12
    );

    camera.lookAt(target);

}
// ==========================
// camera.js
// Teil 2
// Third-Person Erweiterungen
// ==========================


const shoulderOffset = 0.7;


// Spieler Richtung Kamera
function updatePlayerRotation(){

    const direction = new THREE.Vector3();

    camera.getWorldDirection(direction);

    direction.y = 0;

    if(direction.length() > 0){

        const angle = Math.atan2(
            direction.x,
            direction.z
        );

        player.rotation.y = angle;

    }

}


// Bewegung Richtung Kamera
function getCameraDirection(){

    const direction = new THREE.Vector3();

    camera.getWorldDirection(direction);

    direction.y = 0;

    direction.normalize();

    return direction;

}


// Rechte Richtung für A/D
function getCameraRight(){

    const right = new THREE.Vector3();

    camera.getWorldDirection(right);

    right.y = 0;

    right.normalize();

    right.cross(
        new THREE.Vector3(0,1,0)
    );

    return right;

}


// Schulterkamera
function getShoulderPosition(){

    const side = new THREE.Vector3(
        shoulderOffset,
        0,
        0
    );

    side.applyQuaternion(
        camera.quaternion
    );

    return side;

}


// verbesserte Kamera
function updateCameraSmooth(){

    const target = new THREE.Vector3(
        player.position.x,
        player.position.y + cameraHeight,
        player.position.z
    );


    const offset = new THREE.Vector3(
        Math.sin(camYaw) * cameraDistance,
        Math.sin(camPitch) * cameraDistance,
        Math.cos(camYaw) * cameraDistance
    );


    let desired = target.clone()
        .add(offset);


    desired.add(
        getShoulderPosition()
    );


    camera.position.lerp(
        desired,
        0.12
    );


    camera.lookAt(target);

}


// wird von player.js aufgerufen
function cameraUpdate(){

    updateCameraSmooth();

    updatePlayerRotation();

}
