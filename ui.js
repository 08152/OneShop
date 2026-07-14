// ==========================
// ui.js
// Mecha Chameleon UI
// ==========================


const menus = [
    document.getElementById("poseMenu"),
    document.getElementById("paintMenu")
];


// Alle Menüs schließen

function closeMenus(){

    menus.forEach(menu=>{

        if(menu){

            menu.classList.add("hidden");

        }

    });

}


// Nur ein Menü öffnen

function openMenu(menu){

    closeMenus();

    menu.classList.remove("hidden");

}


// ESC schließt alles

window.addEventListener("keydown",(e)=>{

    if(e.key === "Escape"){

        closeMenus();

    }

});


// Klick außerhalb

document.addEventListener(
"mousedown",
(e)=>{


    let clickedMenu = false;


    menus.forEach(menu=>{

        if(
            menu &&
            menu.contains(e.target)
        ){

            clickedMenu = true;

        }

    });


    if(!clickedMenu){

        // nur schließen wenn nicht im Spiel geklickt wird

        if(e.target !== renderer.domElement){

            closeMenus();

        }

    }


});



// HUD Nachricht

function showMessage(text){


    let box =
    document.createElement("div");


    box.innerHTML = text;


    box.style.position="fixed";
    box.style.bottom="30px";
    box.style.left="50%";
    box.style.transform=
    "translateX(-50%)";

    box.style.background=
    "rgba(0,0,0,.7)";

    box.style.color="white";

    box.style.padding="12px 25px";

    box.style.borderRadius="12px";

    box.style.zIndex="999";


    document.body.appendChild(box);



    setTimeout(()=>{

        box.remove();

    },2000);


}



// Startmeldung

setTimeout(()=>{

    showMessage(
        "Mecha Chameleon bereit!"
    );

},1000);
