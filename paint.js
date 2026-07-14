// ==========================
// paint.js
// Mecha Chameleon Mal-System
// ==========================


const paintMenu = document.getElementById("paintMenu");

const colorPicker = document.getElementById("paintColor");

const brushSize = document.getElementById("brushSize");

const clearButton = document.getElementById("clearPaint");


// Malfarbe
let paintColor = "#ff0000";


// Taste 2 Menü öffnen/schließen

window.addEventListener("keydown",(e)=>{

    if(e.key === "2"){

        paintMenu.classList.toggle("hidden");

    }

});


// Farbe ändern

colorPicker.addEventListener("input",()=>{

    paintColor = colorPicker.value;

});



// Körperteile

const paintParts = [

    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg

];


// Raycaster

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();


// Klick zum Bemalen

renderer.domElement.addEventListener(
"mousedown",
(event)=>{


    if(paintMenu.classList.contains("hidden"))
        return;


    mouse.x =
    (event.clientX /
    window.innerWidth) * 2 - 1;


    mouse.y =
    -(event.clientY /
    window.innerHeight) * 2 + 1;



    raycaster.setFromCamera(
        mouse,
        camera
    );


    const hits =
    raycaster.intersectObjects(
        paintParts
    );


    if(hits.length > 0){

        paintObject(
            hits[0].object
        );

    }


});



// Farbe anwenden

function paintObject(object){


    object.material =
    object.material.clone();


    object.material.color =
    new THREE.Color(
        paintColor
    );


    object.material.needsUpdate =
    true;


}



// alles zurücksetzen

clearButton.onclick = ()=>{


    paintParts.forEach(part=>{


        part.material =
        part.material.clone();


        part.material.color =
        new THREE.Color(
            0xaaaaaa
        );


    });


};
