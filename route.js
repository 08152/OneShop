// =====================================
// route.js
// Teil 1/3
// Zielsuche + Route berechnen
// =====================================


// ------------------------------
// Variablen
// ------------------------------

let destination = null;

let routeData = null;

let routePoints = [];

let steps = [];

let routeLine = null;

let remainingLine = null;





// ------------------------------
// Route vorbereiten
// ------------------------------

async function prepareRoute(){

    if(!currentPos){

        alert("GPS noch nicht bereit.");

        return;

    }


    const text =

    document
    .getElementById("ziel")
    .value
    .trim();


    if(text===""){

        alert("Bitte Ziel eingeben.");

        return;

    }


    await searchDestination(text);

}





// ------------------------------
// Ziel suchen
// ------------------------------

async function searchDestination(name){


    updateStatus(

        "🔍 Suche Ziel..."

    );


    const response =

    await fetch(

        "https://nominatim.openstreetmap.org/search?format=json&q="

        +

        encodeURIComponent(name)

    );


    const data =

    await response.json();


    if(data.length===0){

        alert("Ziel nicht gefunden.");

        return;

    }


    destination=[

        parseFloat(data[0].lat),

        parseFloat(data[0].lon)

    ];


    await calculateRoute();

}





// ------------------------------
// Route berechnen
// ------------------------------

async function calculateRoute(){


    updateStatus(

        "🧭 Route wird berechnet..."

    );


    const url =

    "https://router.project-osrm.org/route/v1/driving/"

    +

    currentPos[1]

    +

    ","

    +

    currentPos[0]

    +

    ";"

    +

    destination[1]

    +

    ","

    +

    destination[0]

    +

    "?overview=full"

    +

    "&geometries=geojson"

    +

    "&steps=true";



    const response =

    await fetch(url);


    const json =

    await response.json();


    if(!json.routes ||
       json.routes.length===0){

        alert("Keine Route gefunden.");

        return;

    }


    routeData =

    json.routes[0];


    buildRoute();


}
// =====================================
// route.js
// Teil 2/3
// Route zeichnen + Reststrecke
// =====================================


// ------------------------------
// Route aufbauen
// ------------------------------

function buildRoute(){

    routePoints =

    routeData.geometry.coordinates.map(

        p=>[

            p[1],

            p[0]

        ]

    );



    if(routeLine){

        map.removeLayer(routeLine);

    }


    if(remainingLine){

        map.removeLayer(remainingLine);

    }



    // Gesamte Route

    routeLine =

    L.polyline(

        routePoints,

        {

            color:"#4aa3ff",

            weight:8,

            opacity:.45

        }

    ).addTo(map);



    // Noch zu fahrende Strecke

    remainingLine =

    L.polyline(

        routePoints,

        {

            color:"#006cff",

            weight:8,

            opacity:1

        }

    ).addTo(map);



    // Karte auf Route zoomen

    map.fitBounds(

        remainingLine.getBounds(),

        {

            padding:[50,50]

        }

    );



    // Restzeit

    const minuten =

    Math.round(

        routeData.duration / 60

    );


    setRemainingTime(

        minuten +

        " min"

    );



    // Entfernung

    const km =

    (

        routeData.distance

        /

        1000

    ).toFixed(1);


    setRemainingDistance(

        km +

        " km"

    );



    // Startbutton

    document
    .getElementById("startBtn")
    .style.display="block";



    updateStatus(

        "✅ Route gefunden"

    );



    readSteps();

}





// ------------------------------
// Reststrecke aktualisieren
// ------------------------------

function updateRemainingRoute(){

    if(!remainingLine)
        return;


    if(routePoints.length===0)
        return;


    if(!currentPos)
        return;



    let nearest = 0;

    let best = Infinity;



    routePoints.forEach(

        (point,index)=>{

            const d =

            map.distance(

                currentPos,

                point

            );


            if(d < best){

                best = d;

                nearest = index;

            }

        }

    );



    remainingLine.setLatLngs(

        routePoints.slice(nearest)

    );

}






// ------------------------------
// Restzeit aktualisieren
// ------------------------------

function updateRemainingValues(){

    if(routePoints.length===0)
        return;


    const meters =

    remainingLine
    .getLatLngs()
    .reduce(

        (sum,p,i,a)=>{

            if(i===0)
                return 0;

            return sum +

            map.distance(

                a[i-1],

                p

            );

        },

        0

    );


    setRemainingDistance(

        (meters/1000).toFixed(1)

        +

        " km"

    );


    // ungefähr 50 km/h Durchschnitt

    const min =

    Math.max(

        1,

        Math.round(

            meters / 833

        )

    );


    setRemainingTime(

        min +

        " min"

    );

}
// =====================================
// route.js
// Teil 3/3
// Navigationsschritte + Neuberechnung
// =====================================


// ------------------------------
// Navigationsschritte übernehmen
// ------------------------------

function readSteps(){

    steps = [];
    nextInstruction = 0;

    if(
        !routeData ||
        !routeData.legs ||
        routeData.legs.length===0
    ){
        return;
    }


    routeData.legs[0].steps.forEach(step=>{

        steps.push({

            location:[
                step.maneuver.location[1],
                step.maneuver.location[0]
            ],

            distance:step.distance,

            name:step.name,

            instruction:createInstruction(step)

        });

    });

}




// ------------------------------
// Text erzeugen
// ------------------------------

function createInstruction(step){

    let road="";

    if(step.name && step.name.trim()!==""){

        road=" auf "+step.name;

    }


    const m=step.maneuver;


    if(m.type==="arrive")
        return "Sie haben Ihr Ziel erreicht";


    if(m.type==="depart")
        return "Starten Sie"+road;


    if(m.type==="roundabout")
        return "Im Kreisverkehr die "+(m.exit||1)+". Ausfahrt nehmen"+road;


    if(m.type==="turn"){

        switch(m.modifier){

            case "left":
                return "Links abbiegen"+road;

            case "right":
                return "Rechts abbiegen"+road;

            case "slight left":
                return "Links halten"+road;

            case "slight right":
                return "Rechts halten"+road;

            case "sharp left":
                return "Scharf links abbiegen"+road;

            case "sharp right":
                return "Scharf rechts abbiegen"+road;

            case "uturn":
                return "Bitte wenden";

            default:
                return "Geradeaus weiterfahren"+road;

        }

    }

    return "Weiterfahren"+road;

}




// ------------------------------
// Route verlassen?
// ------------------------------

function checkRouteDeviation(){

    if(!currentPos)
        return;

    if(routePoints.length===0)
        return;


    let shortest=Infinity;


    routePoints.forEach(point=>{

        const d=

        map.distance(

            currentPos,

            point

        );


        if(d<shortest){

            shortest=d;

        }

    });


    if(shortest>80){

        speak(

            "Route verlassen. Neue Route wird berechnet."

        );

        calculateRoute();

    }

}




// ------------------------------
// Navigation aktualisieren
// ------------------------------

function updateNavigation(){

    if(!navigationStarted)
        return;


    updateRemainingRoute();

    updateRemainingValues();

    checkRouteDeviation();


    if(nextInstruction>=steps.length)
        return;


    const step=

    steps[nextInstruction];


    const dist=

    map.distance(

        currentPos,

        step.location

    );


    if(dist<20){

        setInstruction(

            step.instruction

        );

        nextInstruction++;

    }

}




// ------------------------------
// Jede Sekunde aktualisieren
// ------------------------------

setInterval(

()=>{

    updateNavigation();

},

100
);
