import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js";

let scene;
let camera;
let renderer;
let controls;

let raycaster;
let mouse;

let selected = null;

let currentMode = "move";
let brushSize = 0.15;
let sculptMode = "raise";

const objects = [];

const selectedMaterial = new THREE.MeshStandardMaterial({
    color: 0x4f8cff,
    roughness: 0.65,
    metalness: 0.1
});

const normalMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b93a3,
    roughness: 0.65,
    metalness: 0.1
});

init();
animate();

function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x101216);

    scene.fog = new THREE.Fog(0x101216, 15, 80);

    camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.01,
        500
    );

    camera.position.set(7, 6, 9);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.target.set(0, 1, 0);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    createLights();
    createGrid();
    createGround();

    window.addEventListener(
        "resize",
        onResize
    );

    renderer.domElement.addEventListener(
        "pointerdown",
        onPointerDown
    );

    renderer.domElement.addEventListener(
        "pointermove",
        onPointerMove
    );

    renderer.domElement.addEventListener(
        "contextmenu",
        event => event.preventDefault()
    );

    setupUI();
}

function createLights() {

    const ambient = new THREE.HemisphereLight(
        0xffffff,
        0x333333,
        2.5
    );

    scene.add(ambient);

    const directional = new THREE.DirectionalLight(
        0xffffff,
        3
    );

    directional.position.set(
        6,
        12,
        8
    );

    directional.castShadow = true;

    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;

    scene.add(directional);
}

function createGrid() {

    const grid = new THREE.GridHelper(
        40,
        40,
        0x4b5260,
        0x292e36
    );

    grid.position.y = 0;

    scene.add(grid);
}

function createGround() {

    const geometry = new THREE.PlaneGeometry(
        40,
        40
    );

    const material = new THREE.MeshStandardMaterial({
        color: 0x171a20,
        roughness: 0.9,
        metalness: 0
    });

    const ground = new THREE.Mesh(
        geometry,
        material
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;

    ground.receiveShadow = true;

    scene.add(ground);
}

function createSphere() {

    /*
       32 x 32 = 1024+ Modellierungspunkte
    */

    const geometry =
        new THREE.SphereGeometry(
            1.4,
            32,
            32
        );

    geometry.name = "Kugel";

    createObject(
        geometry,
        "Kugel"
    );
}

function createCube() {

    /*
       Ein Würfel wird in eine hochaufgelöste
       Box-Geometrie umgewandelt.
       6 Seiten mit vielen Segmenten.
    */

    const geometry =
        createHighResolutionCube(
            1.8,
            18
        );

    geometry.name = "Würfel";

    createObject(
        geometry,
        "Würfel"
    );
}

function createCylinder() {

    /*
       32 Segmente und 32 Höhen-Segmente.
    */

    const geometry =
        new THREE.CylinderGeometry(
            1.1,
            1.1,
            2.5,
            32,
            32,
            false
        );

    geometry.name = "Zylinder";

    createObject(
        geometry,
        "Zylinder"
    );
}

function createHighResolutionCube(size, segments) {

    const positions = [];
    const normals = [];
    const uvs = [];

    const half = size / 2;

    const faces = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1]
    ];

    for (const normal of faces) {

        const n = new THREE.Vector3(
            normal[0],
            normal[1],
            normal[2]
        );

        let u;
        let v;

        if (Math.abs(n.x) > 0.5) {
            u = new THREE.Vector3(0, 0, 1);
            v = new THREE.Vector3(0, 1, 0);
        }
        else if (Math.abs(n.y) > 0.5) {
            u = new THREE.Vector3(1, 0, 0);
            v = new THREE.Vector3(0, 0, 1);
        }
        else {
            u = new THREE.Vector3(1, 0, 0);
            v = new THREE.Vector3(0, 1, 0);
        }

        for (let y = 0; y < segments; y++) {

            for (let x = 0; x < segments; x++) {

                const x0 = x / segments;
                const x1 = (x + 1) / segments;

                const y0 = y / segments;
                const y1 = (y + 1) / segments;

                const p00 = makeFacePoint(
                    n,
                    u,
                    v,
                    x0,
                    y0,
                    half
                );

                const p10 = makeFacePoint(
                    n,
                    u,
                    v,
                    x1,
                    y0,
                    half
                );

                const p01 = makeFacePoint(
                    n,
                    u,
                    v,
                    x0,
                    y1,
                    half
                );

                const p11 = makeFacePoint(
                    n,
                    u,
                    v,
                    x1,
                    y1,
                    half
                );

                addTriangle(
                    p00,
                    p10,
                    p11,
                    n,
                    positions,
                    normals,
                    uvs
                );

                addTriangle(
                    p00,
                    p11,
                    p01,
                    n,
                    positions,
                    normals,
                    uvs
                );
            }
        }
    }

    const geometry =
        new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(
            normals,
            3
        )
    );

    geometry.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(
            uvs,
            2
        )
    );

    geometry.computeBoundingSphere();

    return geometry;
}

function makeFacePoint(
    normal,
    u,
    v,
    x,
    y,
    half
) {

    const p = normal.clone().multiplyScalar(half);

    p.add(
        u.clone().multiplyScalar(
            (x * 2 - 1) * half
        )
    );

    p.add(
        v.clone().multiplyScalar(
            (y * 2 - 1) * half
        )
    );

    /*
       Normalrichtung korrigieren:
       Für jede Fläche wird die Position
       direkt aus der Flächennormalen erzeugt.
    */

    if (Math.abs(normal.x) > 0.5) {
        p.x = normal.x * half;
    }

    if (Math.abs(normal.y) > 0.5) {
        p.y = normal.y * half;
    }

    if (Math.abs(normal.z) > 0.5) {
        p.z = normal.z * half;
    }

    return p;
}

function addTriangle(
    a,
    b,
    c,
    normal,
    positions,
    normals,
    uvs
) {

    positions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
    );

    for (let i = 0; i < 3; i++) {

        normals.push(
            normal.x,
            normal.y,
            normal.z
        );
    }

    uvs.push(
        0, 0,
        1, 0,
        1, 1
    );
}

function createObject(
    geometry,
    type
) {

    const mesh = new THREE.Mesh(
        geometry,
        normalMaterial.clone()
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.position.set(
        0,
        1.5,
        0
    );

    mesh.userData.type = type;
    mesh.userData.originalGeometry =
        geometry.clone();

    scene.add(mesh);

    objects.push(mesh);

    selectObject(mesh);

    updateVertexInfo();
}

function selectObject(object) {

    if (selected) {
        selected.material =
            normalMaterial;
    }

    selected = object;

    if (selected) {

        selected.material =
            selectedMaterial;

        document.getElementById(
            "selectedInfo"
        ).textContent =
            "Ausgewählt: " +
            selected.userData.type;

        updateVertexInfo();
    }
}

function deselect() {

    if (!selected) return;

    selected.material =
        normalMaterial;

    selected = null;

    document.getElementById(
        "selectedInfo"
    ).textContent =
        "Kein Objekt ausgewählt";

    updateVertexInfo();
}

function updateVertexInfo() {

    const element =
        document.getElementById(
            "vertexInfo"
        );

    if (!selected) {
        element.textContent = "0 Punkte";
        return;
    }

    const count =
        selected.geometry
            .getAttribute("position")
            .count;

    element.textContent =
        count.toLocaleString("de-DE") +
        " Modellierungspunkte";
}

function setupUI() {

    document
        .getElementById("addSphere")
        .onclick = createSphere;

    document
        .getElementById("addCube")
        .onclick = createCube;

    document
        .getElementById("addCylinder")
        .onclick = createCylinder;

    document
        .getElementById("moveMode")
        .onclick = () => setMode("move");

    document
        .getElementById("rotateMode")
        .onclick = () => setMode("rotate");

    document
        .getElementById("scaleMode")
        .onclick = () => setMode("scale");

    document.querySelectorAll(
        ".brush"
    ).forEach(button => {

        button.onclick = () => {

            document.querySelectorAll(
                ".brush"
            ).forEach(b =>
                b.classList.remove("active")
            );

            button.classList.add("active");

            brushSize =
                Number(
                    button.dataset.size
                );
        };
    });

    document
        .getElementById("raiseBrush")
        .onclick = () => {
            sculptMode = "raise";
        };

    document
        .getElementById("lowerBrush")
        .onclick = () => {
            sculptMode = "lower";
        };

    document
        .getElementById("smoothBrush")
        .onclick = () => {
            sculptMode = "smooth";
        };

    document
        .getElementById("deleteObject")
        .onclick = deleteSelected;

    document
        .getElementById("clearScene")
        .onclick = clearScene;
}

function setMode(mode) {

    currentMode = mode;

    document
        .querySelectorAll(".mode")
        .forEach(button =>
            button.classList.remove("active")
        );

    if (mode === "move") {
        document
            .getElementById("moveMode")
            .classList.add("active");
    }

    if (mode === "rotate") {
        document
            .getElementById("rotateMode")
            .classList.add("active");
    }

    if (mode === "scale") {
        document
            .getElementById("scaleMode")
            .classList.add("active");
    }
}

let pointerDownPosition =
    new THREE.Vector2();

let dragging = false;

function onPointerDown(event) {

    if (event.button !== 0) return;

    pointerDownPosition.set(
        event.clientX,
        event.clientY
    );

    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hits =
        raycaster.intersectObjects(
            objects,
            false
        );

    if (hits.length > 0) {

        selectObject(
            hits[0].object
        );

        dragging = true;

        renderer.domElement.setPointerCapture(
            event.pointerId
        );
    }
    else {
        deselect();
    }
}

function onPointerMove(event) {

    if (!dragging || !selected) return;

    const dx =
        event.clientX -
        pointerDownPosition.x;

    const dy =
        event.clientY -
        pointerDownPosition.y;

    pointerDownPosition.set(
        event.clientX,
        event.clientY
    );

    if (currentMode === "move") {

        selected.position.x += dx * 0.01;
        selected.position.y -= dy * 0.01;
    }

    else if (currentMode === "rotate") {

        selected.rotation.y += dx * 0.01;
        selected.rotation.x += dy * 0.01;
    }

    else if (currentMode === "scale") {

        const factor =
            1 + (-dy * 0.01);

        const safeFactor =
            THREE.MathUtils.clamp(
                factor,
                0.85,
                1.15
            );

        selected.scale.multiplyScalar(
            safeFactor
        );
    }
}

rendererSafePointerUp();

function rendererSafePointerUp() {

    window.addEventListener(
        "pointerup",
        () => {
            dragging = false;
        }
    );
}

function deleteSelected() {

    if (!selected) return;

    const index =
        objects.indexOf(selected);

    if (index !== -1) {
        objects.splice(index, 1);
    }

    scene.remove(selected);

    selected.geometry.dispose();
    selected.material.dispose();

    selected = null;

    document.getElementById(
        "selectedInfo"
    ).textContent =
        "Kein Objekt ausgewählt";

    updateVertexInfo();
}

function clearScene() {

    for (const object of objects) {

        scene.remove(object);

        object.geometry.dispose();
        object.material.dispose();
    }

    objects.length = 0;

    selected = null;

    document.getElementById(
        "selectedInfo"
    ).textContent =
        "Kein Objekt ausgewählt";

    updateVertexInfo();
}

function sculptObject(event) {

    if (!selected) return;

    const rect =
        renderer.domElement.getBoundingClientRect();

    mouse.x =
        ((event.clientX - rect.left) /
            rect.width) * 2 - 1;

    mouse.y =
        -((event.clientY - rect.top) /
            rect.height) * 2 + 1;

    raycaster.setFromCamera(
        mouse,
        camera
    );

    const hits =
        raycaster.intersectObject(
            selected,
            false
        );

    if (!hits.length) return;

    const hit = hits[0];

    const localPoint =
        selected.worldToLocal(
            hit.point.clone()
        );

    const position =
        selected.geometry
            .getAttribute("position");

    const normal =
        hit.face.normal.clone();

    const radius = brushSize;

    for (
        let i = 0;
        i < position.count;
        i++
    ) {

        const vertex =
            new THREE.Vector3();

        vertex.fromBufferAttribute(
            position,
            i
        );

        const distance =
            vertex.distanceTo(
                localPoint
            );

        if (distance > radius) continue;

        const strength =
            1 -
            distance / radius;

        const smoothStrength =
            strength * strength;

        if (sculptMode === "raise") {

            vertex.add(
                normal.clone()
                    .multiplyScalar(
                        smoothStrength * 0.08
                    )
            );
        }

        else if (sculptMode === "lower") {

            vertex.add(
                normal.clone()
                    .multiplyScalar(
                        -smoothStrength * 0.08
                    )
            );
        }

        else if (sculptMode === "smooth") {

            const original =
                selected.userData
                    .originalGeometry
                    .getAttribute(
                        "position"
                    );

            const originalVertex =
                new THREE.Vector3();

            originalVertex.fromBufferAttribute(
                original,
                i
            );

            vertex.lerp(
                originalVertex,
                smoothStrength * 0.04
            );
        }

        position.setXYZ(
            i,
            vertex.x,
            vertex.y,
            vertex.z
        );
    }

    position.needsUpdate = true;

    selected.geometry.computeVertexNormals();

    selected.geometry.computeBoundingSphere();

    updateVertexInfo();
}

let sculpting = false;

rendererSculptEvents();

function rendererSculptEvents() {

    renderer.domElement.addEventListener(
        "pointerdown",
        event => {

            if (
                event.button === 0 &&
                selected &&
                currentMode === "move"
            ) {

                /*
                   Modellieren wird nur ausgelöst,
                   wenn beim Klick ein Punkt auf
                   dem ausgewählten Modell getroffen wurde.
                */
            }
        }
    );

    renderer.domElement.addEventListener(
        "pointermove",
        event => {

            if (
                sculpting &&
                selected
            ) {
                sculptObject(event);
            }
        }
    );

    renderer.domElement.addEventListener(
        "pointerup",
        () => {
            sculpting = false;
        }
    );
}

/*
   Shift + Linksklick = Modellierpinsel.
   Dadurch bleibt normales Ziehen für
   Bewegen / Drehen / Skalieren frei.
*/

renderer.domElement.addEventListener(
    "pointerdown",
    event => {

        if (
            event.button === 0 &&
            event.shiftKey &&
            selected
        ) {

            sculpting = true;

            sculptObject(event);
        }
    }
);

function onResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}

function animate() {

    requestAnimationFrame(
        animate
    );

    controls.update();

    renderer.render(
        scene,
        camera
    );
}
