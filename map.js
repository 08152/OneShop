// ======================
// 3D SCENE & ENGINE SETUP
// ======================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ======================
// LIGHTING (Aus Ihrem voll funktionsfähigen FPS-Code)
// ======================
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(50, 100, 50);
scene.add(mainLight);

const fillLight = new THREE.PointLight(0x00d2ff, 1.2);
fillLight.position.set(0, 30, 0);
scene.add(fillLight);

// ======================
// CONTROLS & CAMERA VECTORING
// ======================
const player = new THREE.Object3D();
player.position.set(0, 2, 90); 
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
// MAP GEOMETRY (Drahtgitter-Boden & Berge)
// ======================
const gridHelper = new THREE.GridHelper(300, 60, 0x00d2ff, 0x111625);
scene.add(gridHelper);

const segments = 40;
const mountainGeo = new THREE.PlaneGeometry(600, 600, segments, segments);
mountainGeo.rotateX(-Math.PI / 2);

const posAttr = mountainGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const dist = Math.sqrt(x*x + z*z);
    if (dist > 75) {
        let h = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 35 + Math.sin(x * 0.08) * 6;
        posAttr.setY(i, Math.max(0, h));
    } else {
        posAttr.setY(i, 0);
    }
}
mountainGeo.computeVertexNormals();

const mountains = new THREE.Mesh(mountainGeo, new THREE.MeshStandardMaterial({
    color: 0x0a0f24, flatShading: true, side: THREE.DoubleSide
}));
scene.add(mountains);

const mountainWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(mountainGeo, 2),
    new THREE.LineBasicMaterial({ color: 0x0052d4, transparent: true, opacity: 0.5 })
);
mountains.add(mountainWire);

// ======================
// ROUTE GENERATION
// ======================
let routeMesh;
let mapBuildings = [];

function draw3DRouteOnMap(start, target) {
    if (routeMesh) scene.remove(routeMesh);
    mapBuildings.forEach(b => scene.remove(b));
    mapBuildings = [];

    // Mappt echte Geokoordinaten relativ in den 3D-Raum des Tals
    const sX = (start.lon % 1) * 200 - 100;
    const sZ = (start.lat % 1) * 200 - 100;
    const tX = (target.lon % 1) * 200 - 100;
    const tZ = (target.lat % 1) * 200 - 100;

    const pStart = new THREE.Vector3(sX, 0.2, sZ);
    const pTarget = new THREE.Vector3(tX, 0.2, tZ);
    const pMid = new THREE.Vector3((sX+tX)/2, 6.0, (sZ+tZ)/2 + 15); // Erhöhte Passbrücke

    const curve = new THREE.CatmullRomCurve3([pStart, pMid, pTarget]);
    
    // Generiert die neonblaue Fahrbahn
    routeMesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 1.6, 8, false), 
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0052d4 })
    );
    scene.add(routeMesh);

    // Baut 3D-Häuserzeilen entlang des neuen Pfads auf
    const points = curve.getPoints(20);
    points.forEach((pt, idx) => {
        if (idx === 0 || idx === points.length - 1) return;
        [-9, 9].forEach(offset => {
            const h = 8 + Math.random() * 20;
            const building = new THREE.Mesh(new THREE.BoxGeometry(6, h, 6), new THREE.MeshStandardMaterial({ color: 0x111625 }));
            building.position.set(pt.x + offset, h/2, pt.z);
            building.add(new THREE.LineSegments(new THREE.EdgesGeometry(building.geometry), new THREE.LineBasicMaterial({ color: 0x00d2ff })));
            scene.add(building);
            mapBuildings.push(building);
        });
    });

    // Setzt den Spieler direkt an den Startpunkt der neu berechneten Strecke
    player.position.set(sX, 2, sZ + 20);
    player.lookAt(pStart);
}

// ======================
// MAIN ANIMATION LOOP
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
    if (player.position.y < 2) player.position.y = 2;
}

function animate() {
    requestAnimationFrame(animate);
    updateMap();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
