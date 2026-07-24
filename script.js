/* ==================================
   NortonMarket
   Haupt-JavaScript
================================== */


/* ================================
   Daten Speicher
================================ */


let currentUser = null;

let items = [];



const API_URL = "/api";



/* ================================
   Elemente
================================ */


const accountButton =
document.getElementById("accountButton");


const loginWindow =
document.getElementById("loginWindow");


const profileWindow =
document.getElementById("profileWindow");


const addItemWindow =
document.getElementById("addItemWindow");


const continueLogin =
document.getElementById("continueLogin");


const closeLogin =
document.getElementById("closeLogin");


const closeProfile =
document.getElementById("closeProfile");



/* ================================
   Start
================================ */


window.addEventListener(
"DOMContentLoaded",
()=>{


    loadLocalData();

    updateProfile();

    renderItems();

    syncServer();


});



/* ================================
   LocalStorage laden
================================ */


function loadLocalData(){


    const savedUser =
    localStorage.getItem(
        "norton_user"
    );


    const savedItems =
    localStorage.getItem(
        "norton_items"
    );



    if(savedUser){

        currentUser =
        JSON.parse(savedUser);

    }



    if(savedItems){

        items =
        JSON.parse(savedItems);

    }


}



/* ================================
   LocalStorage speichern
================================ */


function saveLocalData(){


    localStorage.setItem(

        "norton_user",

        JSON.stringify(currentUser)

    );


    localStorage.setItem(

        "norton_items",

        JSON.stringify(items)

    );


}
/* ================================
   Login öffnen
================================ */


accountButton.addEventListener(
"click",
()=>{


    if(currentUser){


        profileWindow.classList.remove(
            "hidden"
        );


    }else{


        loginWindow.classList.remove(
            "hidden"
        );


    }


});



/* ================================
   Login schließen
================================ */


closeLogin.addEventListener(
"click",
()=>{


    loginWindow.classList.add(
        "hidden"
    );


});



closeProfile.addEventListener(
"click",
()=>{


    profileWindow.classList.add(
        "hidden"
    );


});



/* ================================
   Einloggen
================================ */


continueLogin.addEventListener(
"click",
()=>{


    const email =
    document.getElementById(
        "email"
    ).value.trim();


    const pin =
    document.getElementById(
        "pin"
    ).value.trim();



    if(!email || !pin){


        showToast(
            "Bitte E-Mail und PIN eingeben"
        );


        return;

    }



    currentUser = {


        email: email,


        pin: pin,


        created:
        new Date().toISOString()


    };



    saveLocalData();



    updateProfile();



    loginWindow.classList.add(
        "hidden"
    );



    showToast(
        "Erfolgreich eingeloggt"
    );



});



/* ================================
   Profil aktualisieren
================================ */


function updateProfile(){


    const profileMail =
    document.getElementById(
        "profileMail"
    );



    if(currentUser){


        profileMail.textContent =
        currentUser.email;



    }else{


        profileMail.textContent =
        "Nicht eingeloggt";


    }


}
/* ================================
   Abmelden
================================ */


const logoutButton =
document.getElementById(
    "logoutButton"
);



if(logoutButton){


logoutButton.addEventListener(
"click",
()=>{


    currentUser = null;


    localStorage.removeItem(
        "norton_user"
    );


    updateProfile();


    profileWindow.classList.add(
        "hidden"
    );


    showToast(
        "Du wurdest abgemeldet"
    );


});


}



/* ================================
   Artikel hinzufügen öffnen
================================ */


const addItemButton =
document.getElementById(
    "addItemButton"
);



if(addItemButton){


addItemButton.addEventListener(
"click",
()=>{


    if(!currentUser){


        showToast(
            "Bitte zuerst einloggen"
        );


        return;

    }



    profileWindow.classList.add(
        "hidden"
    );


    addItemWindow.classList.remove(
        "hidden"
    );


});


}



/* ================================
   Artikel hinzufügen abbrechen
================================ */


const cancelItemButton =
document.getElementById(
    "cancelItemButton"
);



if(cancelItemButton){


cancelItemButton.addEventListener(
"click",
()=>{


    addItemWindow.classList.add(
        "hidden"
    );


});


}



/* ================================
   Bilder Vorschau
================================ */


function previewImage(
inputId,
imageId
){


const input =
document.getElementById(
    inputId
);


const image =
document.getElementById(
    imageId
);



if(!input || !image)
return;



input.addEventListener(
"change",
()=>{


    const file =
    input.files[0];



    if(file){


        const reader =
        new FileReader();



        reader.onload =
        function(e){


            image.src =
            e.target.result;


        };



        reader.readAsDataURL(
            file
        );


    }


});


}



previewImage(
"image1",
"preview1"
);


previewImage(
"image2",
"preview2"
);


previewImage(
"image3",
"preview3"
);
/* ================================
   Artikel speichern
================================ */


const saveItemButton =
document.getElementById(
    "saveItemButton"
);



if(saveItemButton){


saveItemButton.addEventListener(
"click",
async()=>{


    if(!currentUser){


        showToast(
            "Bitte einloggen"
        );


        return;

    }



    const title =
    document.getElementById(
        "itemTitle"
    ).value.trim();



    const description =
    document.getElementById(
        "itemDescription"
    ).value.trim();



    const condition =
    document.getElementById(
        "itemCondition"
    ).value;



    const price =
    document.getElementById(
        "itemPrice"
    ).value;



    const contact =
    document.getElementById(
        "itemContact"
    ).value.trim();



    if(
        !title ||
        !description ||
        !price
    ){


        showToast(
            "Bitte alle Felder ausfüllen"
        );


        return;

    }



    const images =
    await getImages();



    const newItem = {


        id:
        Date.now(),


        title:title,


        description:description,


        condition:condition,


        price:Number(price),


        contact:contact,


        images:images,


        owner:
        currentUser.email,


        created:
        new Date().toISOString()


    };



    items.unshift(
        newItem
    );



    saveLocalData();



    renderItems();



    syncServer();



    addItemWindow.classList.add(
        "hidden"
    );



    clearItemForm();



    showToast(
        "Artikel wurde veröffentlicht"
    );


});


}



/* ================================
   Bilder auslesen
================================ */


function getImages(){


return new Promise(
(resolve)=>{


    let result = [];


    const ids = [

        "preview1",

        "preview2",

        "preview3"

    ];



    ids.forEach(
    id=>{


        const img =
        document.getElementById(
            id
        );



        if(
            img &&
            img.src &&
            img.src.length > 20
        ){


            result.push(
                img.src
            );


        }


    });



    resolve(result);


});


}



/* ================================
   Formular leeren
================================ */


function clearItemForm(){


const fields = [

"itemTitle",

"itemDescription",

"itemPrice",

"itemContact"

];



fields.forEach(
id=>{


    const el =
    document.getElementById(
        id
    );


    if(el)
    el.value="";


});



[
"preview1",
"preview2",
"preview3"

].forEach(
id=>{


const img =
document.getElementById(id);


if(img)
img.src="";


});


}
/* ================================
   Artikel anzeigen
================================ */


function renderItems(
list = items
){


const grid =
document.getElementById(
    "itemGrid"
);



if(!grid)
return;



grid.innerHTML = "";



if(list.length === 0){


    grid.innerHTML = `

    <div class="emptyBox">

        <h2>
            Keine Artikel vorhanden
        </h2>

        <p>
            Füge den ersten Artikel hinzu.
        </p>

    </div>

    `;


    return;

}



list.forEach(
item=>{


    const card =
    document.createElement(
        "article"
    );


    card.className =
    "itemCard";



    card.innerHTML = `


    <div class="itemImageContainer">


        <img
        class="itemImage"
        src="${item.images[0] || ''}"
        alt="Artikel">


        <div class="itemConditionBadge">

            ${item.condition}

        </div>


    </div>



    <div class="itemContent">


        <h3 class="itemTitle">

            ${item.title}

        </h3>



        <p class="itemDescription">

            ${item.description}

        </p>



        <div class="itemFooter">


            <div class="itemPrice">

                ${item.price.toFixed(2)} €

            </div>



            <button
            class="openItemButton">

                Ansehen

            </button>


        </div>


    </div>


    `;



    const button =
    card.querySelector(
        ".openItemButton"
    );



    button.addEventListener(
    "click",
    ()=>{


        openItem(
            item
        );


    });



    grid.appendChild(
        card
    );


});


}



/* ================================
   Artikel öffnen
================================ */


function openItem(
item
){


const window =
document.getElementById(
    "itemWindow"
);



if(!window)
return;



document.getElementById(
"viewerTitle"
).textContent =
item.title;



document.getElementById(
"viewerPrice"
).textContent =
item.price.toFixed(2)
+" €";



document.getElementById(
"viewerCondition"
).textContent =
item.condition;



document.getElementById(
"viewerContact"
).textContent =
item.contact;



document.getElementById(
"viewerDescription"
).textContent =
item.description;



const mainImage =
document.getElementById(
    "viewerImage"
);



mainImage.src =
item.images[0] || "";



[
"thumb1",
"thumb2",
"thumb3"

].forEach(
(id,index)=>{


const img =
document.getElementById(
    id
);



if(img){


img.src =
item.images[index] || "";



img.onclick =
()=>{


mainImage.src =
item.images[index];


};


}


});



window.classList.remove(
"hidden"
);


}
/* ================================
   Artikel Fenster schließen
================================ */


const closeItemWindow =
document.getElementById(
    "closeItemWindow"
);



if(closeItemWindow){


closeItemWindow.addEventListener(
"click",
()=>{


    document.getElementById(
        "itemWindow"
    )
    .classList.add(
        "hidden"
    );


});


}



/* ================================
   Suche
================================ */


const searchInput =
document.getElementById(
    "searchInput"
);



const searchButton =
document.getElementById(
    "searchButton"
);



if(searchButton){


searchButton.addEventListener(
"click",
()=>{


    performSearch();


});


}



if(searchInput){


searchInput.addEventListener(
"keydown",
(e)=>{


    if(e.key === "Enter"){


        performSearch();


    }


});


}



/* ================================
   Suchfunktion
================================ */


function performSearch(){


const text =
searchInput.value
.toLowerCase()
.trim();



if(text === ""){


    renderItems();


    document.getElementById(
        "searchResults"
    )
    ?.classList.add(
        "hidden"
    );


    return;

}



const results =
items.filter(
item=>{


return (

item.title
.toLowerCase()
.includes(text)


||

item.description
.toLowerCase()
.includes(text)


||

item.condition
.toLowerCase()
.includes(text)


);


});



showSearchResults(
results
);


}



/* ================================
   Suchergebnisse anzeigen
================================ */


function showSearchResults(
results
){


const section =
document.getElementById(
    "searchResults"
);



const grid =
document.getElementById(
    "searchGrid"
);



const count =
document.getElementById(
    "resultCount"
);



if(!section || !grid)
return;



section.classList.remove(
"hidden"
);



count.textContent =

results.length
+
" Treffer";



grid.innerHTML = "";



results.forEach(
item=>{


const card =
document.createElement(
"article"
);



card.className =
"itemCard";



card.innerHTML = `


<img
class="itemImage"
src="${item.images[0] || ''}">


<div class="itemContent">


<h3 class="itemTitle">

${item.title}

</h3>


<div class="itemPrice">

${item.price.toFixed(2)} €

</div>


<button class="openItemButton">

Ansehen

</button>


</div>


`;



card.querySelector(
".openItemButton"
)
.onclick =
()=>openItem(item);



grid.appendChild(
card
);



});


}
/* ================================
   Toast Nachrichten
================================ */


function showToast(
message
){


const container =
document.getElementById(
    "toastContainer"
);



if(!container)
return;



const toast =
document.createElement(
    "div"
);



toast.className =
"toast";



toast.textContent =
message;



container.appendChild(
toast
);



setTimeout(
()=>{


    toast.remove();


},
3000
);


}



/* ================================
   Server Synchronisierung
================================ */


async function syncServer(){


try{


    const response =
    await fetch(
        API_URL + "/items"
    );



    if(response.ok){


        const serverItems =
        await response.json();



        if(Array.isArray(serverItems)){


            items =
            serverItems;



            saveLocalData();



            renderItems();


        }


    }



}

catch(error){


    console.log(
        "Server nicht erreichbar"
    );


}



}



/* ================================
   Daten an Server senden
================================ */


async function uploadItems(){


try{


await fetch(

API_URL + "/items",

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},


body:

JSON.stringify(items)


}

);



}

catch(error){


console.log(
"Upload Fehler",
error
);


}



}



/* ================================
   Automatische Aktualisierung
================================ */


setInterval(
()=>{


    syncServer();


},
10000
);
/* ================================
   Benutzer Synchronisierung
================================ */


async function syncUser(){


if(!currentUser)
return;



try{


const response =
await fetch(

API_URL + "/users"

);



if(response.ok){


const users =
await response.json();



const found =
users.find(
user =>
user.email === currentUser.email
);



if(found){


currentUser =
found;



saveLocalData();



updateProfile();


}


}



}

catch(error){


console.log(
"Benutzer Server nicht erreichbar"
);


}



}



/* ================================
   Benutzer an Server senden
================================ */


async function uploadUser(){


if(!currentUser)
return;



try{


await fetch(

API_URL + "/users",

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},


body:

JSON.stringify(
currentUser
)


}

);



}

catch(error){


console.log(
"Benutzer Upload Fehler"
);


}



}



/* ================================
   Login mit Server prüfen
================================ */


async function checkServerLogin(
email,
pin
){


try{


const response =
await fetch(

API_URL + "/users"

);



if(response.ok){


const users =
await response.json();



const user =
users.find(

u =>

u.email === email
&&
u.pin === pin


);



return user || null;


}



}

catch(error){


return null;


}



return null;


}



/* ================================
   Synchronisierung starten
================================ */


setTimeout(
()=>{


syncUser();


},
2000
);
/* ================================
   Hilfsfunktionen
================================ */


/* Preis formatieren */

function formatPrice(
price
){


return Number(price)
.toLocaleString(
"de-DE",
{

style:"currency",

currency:"EUR"

}

);


}



/* ================================
   Eingaben prüfen
================================ */


function cleanText(
text
){


return String(text)

.trim()

.replace(
/<[^>]*>/g,
""
);


}



/* ================================
   Artikel prüfen
================================ */


function validateItem(
item
){


if(!item.title)
return false;



if(!item.description)
return false;



if(!item.price)
return false;



if(!item.owner)
return false;



return true;


}



/* ================================
   Artikel löschen
================================ */


function deleteItem(
id
){


if(!currentUser)
return;



const item =
items.find(
i=>i.id===id
);



if(
!item ||
item.owner !== currentUser.email
){

showToast(
"Keine Berechtigung"
);


return;

}



items =
items.filter(
i=>i.id!==id
);



saveLocalData();



renderItems();



syncServer();



showToast(
"Artikel gelöscht"
);


}



/* ================================
   Zufällige ID
================================ */


function createID(){


return Date.now()
+
Math.floor(
Math.random()*1000
);


}



/* ================================
   Netzwerk Status
================================ */


window.addEventListener(
"online",
()=>{


showToast(
"Internet verbunden"
);



syncServer();


});


window.addEventListener(
"offline",
()=>{


showToast(
"Offline-Modus aktiv"
);


});
/* ================================
   Start Verbindung
================================ */


/*
   Prüft beim Start:
   - Benutzer
   - Artikel
   - Server
*/


async function initializeApp(){


    loadLocalData();


    updateProfile();


    renderItems();


    await syncServer();


    await syncUser();


}



/* ================================
   App starten
================================ */


if(
document.readyState === "loading"
){


document.addEventListener(
"DOMContentLoaded",
()=>{


    initializeApp();


});


}
else{


initializeApp();


}



/* ================================
   Vor dem Schließen speichern
================================ */


window.addEventListener(
"beforeunload",
()=>{


    saveLocalData();


});



/* ================================
   Ende NortonMarket Script
================================ */
