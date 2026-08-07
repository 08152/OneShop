// ======================
// SCENE & SYSTEM SETUP
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================
// LIGHTING (Aus Ihrem funktionierenden Code)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

const fillLight = new THREE.PointLight(0x00d2ff, 1.2);
fillLight.position.set(0, 30, 0);
scene.add(fillLight);

// ======================
// CONTROLS & PHYSICS (Aus Ihrem Code)
// ======================
const player = new THREE.Object3D();
player.position.set(0, 2, 80); // Startposition vor der Stadtlandschaft
scene.add(player);
player.add(camera);

let velocity = new THREE.Vector3();
let keys = {};

document.onkeydown = (e) => { keys[e.key.toLowerCase()] = true; };
document.onkeyup = (e) => { keys[e.key.toLowerCase()] = false; };

document.body.onclick = () => { document.body.requestPointerLock(); };

let rx = 0, ry = 0;
document.onmousemove = (e) => {
    if (document.pointerLockElement) {
        ry -= e.movementX * 0.002;
        rx -= e.movementY * 0.002;
        rx = Math.max(-1.5, Math.min(1.5, rx));
        camera.rotation.x = rx;
        player.rotation.y = ry;
    }
};

// ======================
// MAP ENVIRONMENT (Echte 3D Berge & Straßen)
// ======================
const gridHelper = new THREE.GridHelper(300, 60, 0x00d2ff, 0x111625);
gridHelper.position.y = 0;
scene.add(gridHelper);

// Prozedurale 3D Berge bauen
const segments = 40;
const mountainGeo = new THREE.PlaneGeometry(600, 600, segments, segments);
mountainGeo.rotateX(-Math.PI / 2);

const posAttr = mountainGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const dist = Math.sqrt(x*x + z*z);
    if (dist > 70) {
        let h = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 35;
        h += Math.sin(x * 0.08) * 8; // Zacken
        posAttr.setY(i, Math.max(0, h));
    } else {
        posAttr.setY(i, 0); // Flaches Stadtzentrum
    }
}
mountainGeo.computeVertexNormals();

const mountains = new THREE.Mesh(mountainGeo, new THREE.MeshStandardMaterial({
    color: 0x0a0f24, flatShading: true, side: THREE.DoubleSide
}));
scene.add(mountains);

// Leuchtendes Höhennetz auf Bergen
const mountainWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(mountainGeo, 2),
    new THREE.LineBasicMaterial({ color: 0x0052d4, transparent: true, opacity: 0.5 })
);
mountains.add(mountainWire);

// ======================
// ROUTING ELEMENTS
// ======================
let routeMesh;
let mapBuildings = [];

function draw3DRouteOnMap() {
    if (routeMesh) scene.remove(routeMesh);
    mapBuildings.forEach(b => scene.remove(b));
    mapBuildings = [];

    // Blaue 3D Route als leuchtender Pfad durch das Tal
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-40, 0.2, 40),
        new THREE.Vector3(-10, 0.2, 10),
        new THREE.Vector3(15, 3.5, -15), // Brücke
        new THREE.Vector3(40, 0.2, -40)
    ]);
    
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 1.5, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0052d4 });
    routeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(routeMesh);

    // 3D-Häuser am Rand der blauen Route hochziehen
    const points = curve.getPoints(30);
    points.forEach((pt, idx) => {
        if (idx < 2 || idx > points.length - 2) return;
        [-10, 10].forEach(sideOffset => {
            const hHeight = 8 + Math.random() * 25;
            const bGeo = new THREE.BoxGeometry(6, hHeight, 6);
            const bMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.4 });
            const building = new THREE.Mesh(bGeo, bMat);
            
            building.position.set(pt.x + sideOffset, hHeight / 2, pt.z);
            
            // Leuchtende Fenstergitter-Konturen
            const wire = new THREE.LineSegments(new THREE.EdgesGeometry(bGeo), new THREE.LineBasicMaterial({ color: 0x00d2ff }));
            building.add(wire);
            
            scene.add(building);
            mapBuildings.push(building);
        });
    });
}

// ======================
// ENGINE UPDATE & LOOP
// ======================
function updateMap() {
    let dir = new THREE.Vector3();
    if (keys.w) dir.z -= 1;
    if (keys.s) dir.z += 1;
    if (keys.a) dir.x -= 1;
    if (keys.d) dir.x += 1;

    dir.normalize();
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);

    velocity.x += dir.x * 0.15;
    velocity.z += dir.z * 0.15;
    velocity.x *= 0.82;
    velocity.z *= 0.82;

    player.position.add(velocity);

    // Auf dem Boden halten
    if (player.position.y < 2) {
        player.position.y = 2;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateMap();
    renderer.render(scene, camera);
}

// Responsive resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
animate();
