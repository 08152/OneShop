// ======================================
// paint.js
// Mecha Chameleon Mal-System
// Three.js Version
// ======================================



const paintMenu =
document.getElementById("paintMenu");



const colorPicker =
document.getElementById("paintColor");



let selectedColor =
"#00ff00";





// ===============================
// Taste 2
// ===============================


window.addEventListener(
"keydown",
(e)=>{


    if(e.key === "2"){


        paintMenu.classList.toggle(
            "hidden"
        );


    }


});







// ===============================
// Farbe ändern
// ===============================


colorPicker.addEventListener(
"input",
()=>{


    selectedColor =
    colorPicker.value;


});







// ===============================
// Raycaster
// ===============================


const raycaster =
new THREE.Raycaster();


const mouse =
new THREE.Vector2();






// bemalbare Teile

const paintObjects = [

    body,
    head,

    leftArm,
    rightArm,

    leftLeg,
    rightLeg

];







// ===============================
// Anklicken
// ===============================


renderer.domElement.addEventListener(
"mousedown",
(event)=>{



    if(
        paintMenu.classList.contains(
            "hidden"
        )
    )
    return;





    mouse.x =
    (event.clientX /
    window.innerWidth)
    *2-1;



    mouse.y =
    -(event.clientY /
    window.innerHeight)
    *2+1;






    raycaster.setFromCamera(
        mouse,
        camera
    );





    const hit =
    raycaster.intersectObjects(
        paintObjects
    );





    if(hit.length>0){


        paintMesh(
            hit[0].object
        );


    }



});








// ===============================
// Farbe setzen
// ===============================


function paintMesh(mesh){



    mesh.material =
    mesh.material.clone();



    mesh.material.color =
    new THREE.Color(
        selectedColor
    );



    mesh.material.needsUpdate =
    true;


}








// ===============================
// Alles zurücksetzen
// ===============================


const clearButton =
document.getElementById(
"clearPaint"
);



if(clearButton){


clearButton.onclick =
()=>{


    paintObjects.forEach(
    mesh=>{


        mesh.material =
        mesh.material.clone();


        mesh.material.color =
        new THREE.Color(
            0x999999
        );


    });


};


}
