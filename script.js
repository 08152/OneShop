// =====================================
// GPS Navi
// script.js
// Hauptdatei
// =====================================


// ------------------------------
// Variablen
// ------------------------------

let navigationStarted = false;
let followLocation = true;
let gpsReady = false;


// ------------------------------
// Buttons
// ------------------------------

const zielInput =
document.getElementById("ziel");

const routeBtn =
document.getElementById("routeBtn");

const startBtn =
document.getElementById("startBtn");

const locationBtn =
document.getElementById("locationBtn");

const fullscreenBtn =
document.getElementById("fullscreenBtn");

const info =
document.getElementById("info");

const naviInfo =
document.getElementById("naviInfo");




// ------------------------------
// Seite geladen
// ------------------------------

window.addEventListener(

"load",

()=>{

    console.log("GPS Navi gestartet");

    initMap();

    initGPS();

    loadVoices();

}

);




// ------------------------------
// Route suchen
// ------------------------------

routeBtn.addEventListener(

"click",

async()=>{

    if(!gpsReady){

        alert("Bitte warten bis GPS bereit ist.");

        return;

    }

    await prepareRoute();

}

);




// ------------------------------
// Navigation starten
// ------------------------------

startBtn.addEventListener(

"click",

()=>{

    navigationStarted = true;

    followLocation = true;

    naviInfo.style.display="block";

    speak(
        "Navigation gestartet."
    );

}

);




// ------------------------------
// Standort
// ------------------------------

locationBtn.addEventListener(

"click",

()=>{

    centerLocation();

}

);




// ------------------------------
// Vollbild
// ------------------------------

fullscreenBtn.addEventListener(

"click",

()=>{

    toggleFullscreen();

}

);




// ------------------------------
// Vollbild
// ------------------------------

function toggleFullscreen(){

    if(!document.fullscreenElement){

        document.documentElement.requestFullscreen();

    }

    else{

        document.exitFullscreen();

    }

}




// ------------------------------
// GPS bereit
// ------------------------------

function gpsLoaded(){

    gpsReady=true;

    info.innerHTML="📍 GPS bereit";

}




// ------------------------------
// Navigation stoppen
// ------------------------------

function stopNavigation(){

    navigationStarted=false;

    followLocation=false;

    naviInfo.style.display="none";

    speak("Navigation beendet.");

}




// ------------------------------
// Fehler anzeigen
// ------------------------------

function showError(text){

    console.error(text);

    info.innerHTML=text;

}




// ------------------------------
// Infos aktualisieren
// ------------------------------

function updateStatus(text){

    info.innerHTML=text;

}




// ------------------------------
// Restzeit
// ------------------------------

function setRemainingTime(text){

    document.getElementById(
        "timeLeft"
    ).innerHTML=text;

}




// ------------------------------
// Restentfernung
// ------------------------------

function setRemainingDistance(text){

    document.getElementById(
        "distanceLeft"
    ).innerHTML=text;

}




// ------------------------------
// Nächster Hinweis
// ------------------------------

function setInstruction(text){

    document.getElementById(
        "nextInstruction"
    ).innerHTML=text;

}




// ------------------------------
// Benutzer bewegt Karte
// ------------------------------

map.on(

"dragstart",

()=>{

    followLocation=false;

}

);


map.on(

"zoomstart",

()=>{

    followLocation=false;

}

);
