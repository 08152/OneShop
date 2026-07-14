// ======================================
// ui.js
// Mecha Chameleon UI
// Three.js Version
// ======================================



const allMenus = [

    document.getElementById("poseMenu"),

    document.getElementById("paintMenu")

];




// ===============================
// Alle Menüs schließen
// ===============================


function closeAllMenus(){


    allMenus.forEach(
    menu=>{


        if(menu){

            menu.classList.add(
                "hidden"
            );

        }


    });


}





// ===============================
// Menü öffnen
// ===============================


function openMenu(menu){


    closeAllMenus();


    if(menu){

        menu.classList.remove(
            "hidden"
        );

    }


}







// ===============================
// ESC
// ===============================


window.addEventListener(
"keydown",
(e)=>{


    if(e.key==="Escape"){

        closeAllMenus();

    }


});








// ===============================
// Nachricht anzeigen
// ===============================


function showMessage(text){



    const msg =
    document.createElement(
        "div"
    );



    msg.innerText=text;



    msg.style.position="fixed";

    msg.style.bottom="30px";

    msg.style.left="50%";

    msg.style.transform=
    "translateX(-50%)";



    msg.style.background=
    "rgba(0,0,0,0.75)";



    msg.style.color="white";



    msg.style.padding=
    "12px 25px";



    msg.style.borderRadius=
    "12px";



    msg.style.zIndex="9999";



    document.body.appendChild(
        msg
    );



    setTimeout(
        ()=>{

            msg.remove();

        },

        2000
    );


}






// ===============================
// Startmeldung
// ===============================


setTimeout(
()=>{

    showMessage(
        "Mecha Chameleon gestartet!"
    );


},
1000
);
