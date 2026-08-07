// --- GLOBALE GRAFIK-VARIABLEN ---
let scene, camera, renderer;
let routeTube, carArrow;
let environmentObjects = [];
let routePoints3D = [];
let carProgress = 0;

// 3D-Welt sofort beim Starten der Datei aufbauen
init3DMap();

function init3DMap() {
    const container = document.getElementById('webgl-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.012); // Blauer atmosphärischer Tiefennebel

    camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lichtquellen für Plastizität
    scene.add(new THREE.AmbientLight(0x0a1128));
    const directionalLight = new THREE.DirectionalLight(0x00d2ff, 1.8);
    directionalLight.position.set(50, 150, 50);
    scene.add(directionalLight);

    // Digitales Straßen-Koordinatenraster auf dem Boden
    const gridHelper = new THREE.GridHelper(300, 60, 0x00d2ff, 0x111625);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // Echte 3D-Bergketten generieren
    generate3DMountains();

    // Kamera-Startposition im Orbit-Schwenk-Modus
    camera.position.set(0, 50, 90);
    camera.lookAt(0, 0, 0);

    animateMapLoop();
}

// Erzeugt prozedural zackige 3D-Berge links und rechts des Tals
function generate3DMountains() {
    const segments = 60;
    const mountainGeo = new THREE.PlaneGeometry(500, 500, segments, segments);
    mountainGeo.rotateX(-Math.PI / 2); // Ebene waagerecht ausrichten

    const position = mountainGeo.attributes.position;
    for (let i = 0; i < position.count; i++) {
        const x = position.getX(i);
        const z = position.getZ(i);
        const distFromCenter = Math.sqrt(x*x + z*z);

        // Das Zentrum bleibt flach für das Straßennetz
        if (distFromCenter > 75) {
            let height = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 26;
            height += Math.sin(x * 0.1) * Math.sin(z * 0.1) * 7; // Details und Bergzacken
            const fadeFactor = Math.min((distFromCenter - 75) / 100, 1.8);
            position.setY(i, Math.max(0, height * fadeFactor));
        } else {
            position.setY(i, 0);
        }
    }
    mountainGeo.computeVertexNormals();

    const mountainMesh = new THREE.Mesh(mountainGeo, new THREE.MeshPhongMaterial({
        color: 0x070c1f, emissive: 0x020514, flatShading: true // Macht das Gebirge kantig und plastisch
    }));
    scene.add(mountainMesh);

    // Leuchtendes Höhenlinien-Raster auf die Berge projizieren
    const mountainWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(mountainGeo, 1), 
        new THREE.LineBasicMaterial({ color: 0x0052d4, transparent: true, opacity: 0.4 })
    );
    mountainMesh.add(mountainWire);
}

// Zeichnet die blaue 3D-Route und setzt das Navigations-Fahrzeug auf die Karte
function draw3DRouteOnMap(calculatedKm) {
    // Vorheriges Karten-Overlay entfernen
    if (routeTube) scene.remove(routeTube);
    if (carArrow) scene.remove(carArrow);
    environmentObjects.forEach(obj => scene.remove(obj));
    environmentObjects = [];

    // Dynamischer, geschwungener 3D-Straßenverlauf durch das Gebirgstal
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-45, 0, 35),
        new THREE.Vector3(-15, 0, 10),
        new THREE.Vector3(15, 4, -15), // Höhenanstieg simuliert Brückenstraße
        new THREE.Vector3(45, 0, -40)
    ]);
    routePoints3D = curve.getPoints(150);

    // Die Route als dreidimensionales, blau leuchtendes Band (Tube)
    routeTube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 1.4, 8, false), 
        new THREE.MeshPhongMaterial({ color: 0x00d2ff, emissive: 0x0052d4, transparent: true, opacity: 0.8 })
    );
    scene.add(routeTube);

    // Das 3D-Ortungs-Fahrzeug (Ein leuchtender Navigations-Pfeil)
    carArrow = new THREE.Group();
    const arrowMesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.8, 4.5, 4), 
        new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x0088ff })
    );
    arrowMesh.rotateX(Math.PI / 2); // In Fahrtrichtung legen
    carArrow.add(arrowMesh);

    // Das Scheinwerferlicht des Navigationspfeils wirft Licht auf Straßen und Häuser
    const headlight = new THREE.PointLight(0x00ffff, 3, 18);
    headlight.position.set(0, 1, -2);
    carArrow.add(headlight);

    scene.add(carArrow);
    carProgress = 0; // Animation neustarten

    // Prozedurale Häuserzeilen (3D-Gebäude) entlang des Straßenrandes hochwachsen lassen
    for (let i = 6; i < routePoints3D.length - 6; i += 5) {
        const pt = routePoints3D[i];
        [-9, 9].forEach(sideOffset => {
            const hHeight = 4 + Math.random() * 22; // Zufällige Haushöhen
            const bGeo = new THREE.BoxGeometry(4.5, hHeight, 4.5);
            const building = new THREE.Mesh(bGeo, new THREE.MeshPhongMaterial({ color: 0x0c1020, emissive: 0x001133 }));
            
            building.position.set(pt.x + sideOffset, hHeight/2, pt.z + (Math.random()*4 - 2));
            // Blaue Vektor-Konturen für die Cyber-Gebäude
            building.add(new THREE.LineSegments(new THREE.EdgesGeometry(bGeo), new THREE.LineBasicMaterial({ color: 0x0052d4 })));
            
            scene.add(building);
            environmentObjects.push(building);
        });
    }
}

// Kontinuierliche Animations-Schleife für Kamera und Routenverlauf
function animateMapLoop() {
    requestAnimationFrame(animateMapLoop);

    if (carArrow && routePoints3D.length > 0) {
        carProgress += 0.0025; // Geschwindigkeit der Kamera-/Pfeilfahrt
        if (carProgress > 1) carProgress = 0; // Zurück zum Start (Endlos-Schleife)

        const idx = Math.floor(carProgress * (routePoints3D.length - 1));
        const nextIdx = Math.min(idx + 1, routePoints3D.length - 1);
        
        const currentPt = routePoints3D[idx];
        const nextPt = routePoints3D[nextIdx];

        // Position des Pfeils anpassen
        carArrow.position.copy(currentPt);
        carArrow.position.y += 1.1;
        carArrow.lookAt(nextPt.x, nextPt.y + 1.1, nextPt.z);

        // Kinematische Kameraverfolgung aus der Vogelperspektive direkt hinter dem Pfeil
        const camOffset = new THREE.Vector3(0, 16, 28);
        camOffset.applyQuaternion(carArrow.quaternion);
        camera.position.copy(carArrow.position).add(camOffset);
        camera.lookAt(carArrow.position);
    } else {
        // Leerlauf-Modus: Kamera kreist majestätisch über den 3D-Bergen
        const time = Date.now() * 0.00015;
        camera.position.set(Math.sin(time) * 140, 60, Math.cos(time) * 140);
        camera.lookAt(0, 10, 0);
    }

    renderer.render(scene, camera);
}

// Fenster-Resizing abfangen
window.addEventListener('resize', () => {
    const container = document.getElementById('webgl-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
