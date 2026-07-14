// ======================================
// camera.js
// Three.js Third Person Kamera
// ======================================


let camYaw = 0;

let camPitch = 0.35;


let cameraDistance = 6;


const minDistance = 3;
const maxDistance = 12;


const cameraHeight = 2.5;



// ===============================
// Maus Steuerung
// ===============================


let mouseActive = false;



renderer.domElement.addEventListener(
"mousedown",
()=>{

    mouseActive=true;

});



window.addEventListener(
"mouseup",
()=>{

    mouseActive=false;

});



window.addEventListener(
"mousemove",
(e)=>{


    if(!mouseActive)
        return;



    camYaw -=
    e.movementX * 0.005;



    camPitch -=
    e.movementY * 0.005;



    camPitch =
    Math.max(
        -0.5,
        Math.min(
            1.2,
            camPitch
        )
    );


});




// ===============================
// Zoom
// ===============================


window.addEventListener(
"wheel",
(e)=>{


    cameraDistance +=
    e.deltaY * 0.01;



    cameraDistance =
    Math.max(
        minDistance,
        Math.min(
            maxDistance,
            cameraDistance
        )
    );


});






// ===============================
// Kamera Update
// ===============================


function updateCamera(){



    const target =
    new THREE.Vector3(

        player.position.x,

        player.position.y
        + cameraHeight,

        player.position.z

    );





    const offset =
    new THREE.Vector3(


        Math.sin(camYaw)
        *
        cameraDistance,


        Math.sin(camPitch)
        *
        cameraDistance,


        Math.cos(camYaw)
        *
        cameraDistance


    );





    const wanted =
    target.clone()
    .add(offset);





    // weiches Folgen

    camera.position.lerp(

        wanted,

        0.12

    );





    camera.lookAt(
        target
    );



}
