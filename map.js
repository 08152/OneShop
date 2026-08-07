// =====================================
// map.js
// Teil 1/2
// Karte + GPS + Fahrzeugmarker
// =====================================


// ------------------------------
// Globale Variablen
// ------------------------------

let map;

let currentPos = null;

let marker = null;

let heading = 0;


// Fahrzeugmarker

const carIcon = L.divIcon({

    className:"",

    html:
    `
    <div class="car-marker"></div>
    `,

    iconSize:[36,36],

    iconAnchor:[18,18]

});




// ------------------------------
// Karte starten
// ------------------------------

function initMap(){

    map = L.map("map",{

        zoomControl:false

    }).setView(

        [48.1351,11.5820],

        17

    );



    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {

            maxZoom:20,

            attribution:
            "&copy; OpenStreetMap"

        }

    ).addTo(map);

}





// ------------------------------
// GPS starten
// ------------------------------

function initGPS(){


    if(!navigator.geolocation){

        showError(
            "GPS wird nicht unterstützt."
        );

        return;

    }



    navigator.geolocation.watchPosition(

        gpsSuccess,

        gpsError,

        {

            enableHighAccuracy:true,

            maximumAge:0,

            timeout:10000

        }

    );

}





// ------------------------------
// GPS Erfolg
// ------------------------------

function gpsSuccess(position){


    const lat =
    position.coords.latitude;

    const lng =
    position.coords.longitude;



    currentPos = [

        lat,

        lng

    ];



    if(position.coords.heading !== null &&
       !isNaN(position.coords.heading)){

        heading =
        position.coords.heading;

    }



    if(marker==null){

        marker =

        L.marker(

            currentPos,

            {

                icon:carIcon

            }

        ).addTo(map);



        map.setView(

            currentPos,

            19

        );



        gpsLoaded();

    }

    else{

        marker.setLatLng(

            currentPos

        );

    }



    updateCarRotation();



    if(followLocation){

        map.panTo(

            currentPos,

            {

                animate:true,

                duration:0.7

            }

        );

    }



    updateStatus(

        "📍 "

        +

        lat.toFixed(6)

        +

        ", "

        +

        lng.toFixed(6)

    );



}






// ------------------------------
// GPS Fehler
// ------------------------------

function gpsError(error){

    showError(

        "GPS Fehler: "

        +

        error.message

    );

}
// =====================================
// map.js
// Teil 2/2
// Fahrzeug drehen + Zentrierung
// =====================================


// ------------------------------
// Fahrzeug drehen
// ------------------------------

function updateCarRotation(){

    if(!marker)
        return;


    const element =
    marker.getElement();


    if(!element)
        return;


    const car =
    element.querySelector(".car-marker");


    if(!car)
        return;


    car.style.transform =

        "rotate("

        +

        heading

        +

        "deg)";

}




// ------------------------------
// Standort zentrieren
// ------------------------------

function centerLocation(){

    if(!currentPos)
        return;


    followLocation = true;


    map.flyTo(

        currentPos,

        19,

        {

            animate:true,

            duration:0.8

        }

    );

}




// ------------------------------
// Benutzer bewegt Karte
// ------------------------------

map.on(

"dragstart",

()=>{

    followLocation = false;

}

);


map.on(

"zoomstart",

()=>{

    followLocation = false;

}

);




// ------------------------------
// Kompass (wenn verfügbar)
// ------------------------------

window.addEventListener(

"deviceorientationabsolute",

e=>{

    if(e.alpha===null)
        return;


    // Nur verwenden, wenn GPS keine Fahrtrichtung liefert
    if(heading===0){

        heading =

        360 - e.alpha;


        updateCarRotation();

    }

}

);




// ------------------------------
// Marker aktualisieren
// ------------------------------

function updateMarker(lat,lng){

    currentPos = [lat,lng];


    if(marker){

        marker.setLatLng(

            currentPos

        );

    }


    if(followLocation){

        map.panTo(

            currentPos,

            {

                animate:true,

                duration:0.5

            }

        );

    }

}




// ------------------------------
// Karte aktualisieren
// ------------------------------

function refreshMap(){

    if(map){

        map.invalidateSize();

    }

}




// ------------------------------
// Fenstergröße geändert
// ------------------------------

window.addEventListener(

"resize",

()=>{

    refreshMap();

}

);




// ------------------------------
// Karte fertig
// ------------------------------

console.log(

"map.js geladen"

);
