// =====================================
// logik.js
// Teil 1/5
// Sprachsystem + Stimmen
// =====================================



// ------------------------------
// Variablen
// ------------------------------

let selectedVoice = null;

let speechReady = false;

let lastSpeech = "";




// ------------------------------
// Stimme laden
// ------------------------------

function loadVoices(){


    let voices =

    speechSynthesis.getVoices();



    const preferred = [

        "Google Deutsch",

        "Microsoft Katja",

        "Microsoft Hedda",

        "Microsoft Stefan",

        "Anna",

        "Helena",

        "de-DE"

    ];



    selectedVoice = null;



    for(let name of preferred){


        let found =

        voices.find(

            v =>

            v.name.includes(name)

        );



        if(found){

            selectedVoice = found;

            break;

        }


    }



    if(!selectedVoice){


        selectedVoice =

        voices.find(

            v =>

            v.lang.startsWith("de")

        );


    }



    speechReady=true;


}




speechSynthesis.onvoiceschanged =
loadVoices;


loadVoices();







// ------------------------------
// Sprachfunktion
// ------------------------------

function speak(text){



    if(!text)
        return;



    // doppelte Ansagen verhindern

    if(text===lastSpeech)
        return;



    lastSpeech=text;



    speechSynthesis.cancel();



    let message =

    new SpeechSynthesisUtterance();



    message.text=text;


    message.lang="de-DE";


    message.rate=0.9;


    message.pitch=1;


    message.volume=1;



    if(selectedVoice){

        message.voice=selectedVoice;

    }



    speechSynthesis.speak(message);



}







// ------------------------------
// Navigations-Wörter
// ------------------------------


const navWords = {


start:[

"Navigation gestartet",

"Die Route beginnt",

"Los geht es",

"Fahrt beginnt",

"Bereit zur Navigation"

],



continue:[

"Weiterfahren",

"Geradeaus weiter",

"Der Straße folgen",

"Folgen Sie dem Straßenverlauf",

"Bitte weiterfahren",

"Halten Sie die aktuelle Richtung"

],



left:[

"links abbiegen",

"nach links abbiegen",

"die linke Straße nehmen",

"links halten",

"halten Sie sich links"

],



right:[

"rechts abbiegen",

"nach rechts abbiegen",

"die rechte Straße nehmen",

"rechts halten",

"halten Sie sich rechts"

],



straight:[

"geradeaus fahren",

"weiter geradeaus",

"der Straße folgen",

"fahren Sie weiter geradeaus",

"bleiben Sie auf dieser Straße"

],



turn:[

"Bitte wenden",

"Wenden Sie, sobald möglich",

"Fahrtrichtung ändern",

"Bitte drehen Sie um"

],



arrive:[

"Sie haben Ihr Ziel erreicht",

"Das Ziel befindet sich vor Ihnen",

"Sie sind angekommen",

"Navigation beendet"

]

};





// ------------------------------
// Zufällige Variante
// ------------------------------

function randomWord(array){


    return array[

        Math.floor(

            Math.random()

            *

            array.length

        )

    ];


}
// =====================================
// logik.js
// Teil 2/5
// Abbiegeansagen
// =====================================



let said500 = false;

let said300 = false;

let said100 = false;

let said50 = false;

let saidNow = false;





// ------------------------------
// Abstand formatieren
// ------------------------------

function formatDistance(meters){


    if(meters >= 1000){


        return (

            (meters / 1000)

            .toFixed(1)

            +

            " Kilometer"

        );


    }


    return Math.round(meters)

    +

    " Meter";

}







// ------------------------------
// Straßenname hinzufügen
// ------------------------------

function roadText(name){


    if(!name || name.trim()===""){


        return "";


    }


    return (

        " auf "

        +

        name

    );


}







// ------------------------------
// Ansage erstellen
// ------------------------------

function createVoiceInstruction(step,distance){



    let road =

    roadText(step.name);



    let action =

    step.instruction;



    let distanceText =

    formatDistance(distance);






    if(distance < 20){


        return (

            "Jetzt. "

            +

            action

        );


    }





    if(distance < 50){


        return (

            "In 50 Metern. "

            +

            action

        );


    }





    if(distance < 100){


        return (

            "In 100 Metern. "

            +

            action

        );


    }





    if(distance < 300){


        return (

            "In 300 Metern. "

            +

            action

        );


    }





    return (

        "In "

        +

        distanceText

        +

        ". "

        +

        action

    );



}







// ------------------------------
// Abbiegeprüfung
// ------------------------------

function checkVoiceDistance(step,distance){



    if(distance > 500){

        return;

    }





    if(distance <= 500 && !said500){


        speak(

            "In 500 Metern. "

            +

            step.instruction

        );


        said500=true;


    }





    if(distance <= 300 && !said300){


        speak(

            "In 300 Metern. "

            +

            step.instruction

        );


        said300=true;


    }





    if(distance <= 100 && !said100){


        speak(

            "In 100 Metern. "

            +

            step.instruction

        );


        said100=true;


    }





    if(distance <= 50 && !said50){


        speak(

            "In 50 Metern. "

            +

            step.instruction

        );


        said50=true;


    }





    if(distance <= 15 && !saidNow){


        speak(

            "Jetzt. "

            +

            step.instruction

        );


        setInstruction(

            step.instruction

        );


        saidNow=true;



        resetVoiceFlags();


    }


}







// ------------------------------
// Nach Abbiegen zurücksetzen
// ------------------------------

function resetVoiceFlags(){


    said500=false;

    said300=false;

    said100=false;

    said50=false;

    saidNow=false;


}







// ------------------------------
// Spezielle Hinweise
// ------------------------------

const extraMessages = [


"Bitte achten Sie auf den Verkehr",

"Fahren Sie vorsichtig",

"Die Route wird aktualisiert",

"Neue Route wird berechnet",

"Bitte bleiben Sie auf der Straße",

"Geschwindigkeitsbegrenzung beachten",

"Sie nähern sich Ihrem Ziel"


];






function randomMessage(){


    return randomWord(

        extraMessages

    );


}
// =====================================
// logik.js
// Teil 3/5
// Erweiterte Navigationsansagen
// =====================================



// ------------------------------
// Erweiterte Anweisungen
// ------------------------------

function advancedInstruction(step){


    let road =

    roadText(step.name);



    let type =

    step.type;



    let modifier =

    step.modifier;





    // Ziel erreicht

    if(type==="arrive"){


        return randomWord(

            navWords.arrive

        );


    }





    // Start

    if(type==="depart"){


        return (

            randomWord(

                navWords.start

            )

            +

            road

        );


    }







    // Kreisverkehr

    if(type==="roundabout"){



        let exit =

        step.exit || 1;



        let exits=[

            "erste",

            "zweite",

            "dritte",

            "vierte",

            "fünfte"

        ];



        let exitText =

        exits[exit-1]

        ||

        exit;



        return (

            "Im Kreisverkehr "

            +

            "die "

            +

            exitText

            +

            " Ausfahrt nehmen"

            +

            road

        );


    }







    // Abbiegen

    if(type==="turn"){



        if(modifier==="left"){


            return (

                randomWord(

                    navWords.left

                )

                +

                road

            );


        }




        if(modifier==="right"){


            return (

                randomWord(

                    navWords.right

                )

                +

                road

            );


        }



        if(modifier==="slight left"){


            return (

                "Leicht links halten"

                +

                road

            );


        }



        if(modifier==="slight right"){


            return (

                "Leicht rechts halten"

                +

                road

            );


        }



        if(modifier==="sharp left"){


            return (

                "Scharf links abbiegen"

                +

                road

            );


        }



        if(modifier==="sharp right"){


            return (

                "Scharf rechts abbiegen"

                +

                road

            );


        }



        if(modifier==="uturn"){


            return randomWord(

                navWords.turn

            );


        }


    }







    return (

        randomWord(

            navWords.continue

        )

        +

        road

    );


}








// ------------------------------
// Ziel erreicht
// ------------------------------

function reachedDestination(){


    speak(

        randomWord(

            navWords.arrive

        )

    );


    navigationStarted=false;


    setInstruction(

        "🏁 Ziel erreicht"

    );


}







// ------------------------------
// Zusätzliche Fahrhinweise
// ------------------------------

const drivingHints=[


"Bleiben Sie auf der aktuellen Straße",

"Achten Sie auf die Fahrbahn",

"Folgen Sie der Route",

"Die nächste Möglichkeit nehmen",

"Bereiten Sie sich auf die Abbiegung vor",

"Bitte fahren Sie vorsichtig",

"Halten Sie ausreichend Abstand",

"Die Route wird weitergeführt"


];






function speakDrivingHint(){


    speak(

        randomWord(

            drivingHints

        )

    );


}







// ------------------------------
// Spurhinweise
// ------------------------------

const laneMessages=[


"Bitte links einordnen",

"Bitte rechts einordnen",

"Nutzen Sie die mittlere Spur",

"Halten Sie sich auf der rechten Spur",

"Bereiten Sie den Spurwechsel vor",

"Bleiben Sie auf Ihrer Spur"


];






function speakLaneHint(){


    speak(

        randomWord(

            laneMessages

        )

    );


}
// =====================================
// logik.js
// Teil 4/5
// Route verlassen + Neuberechnung
// =====================================



let recalculating=false;

let lastRecalculate=0;



// ------------------------------
// Route verlassen prüfen
// ------------------------------

function checkRouteLost(){


    if(!currentPos)
        return;


    if(!routePoints ||
       routePoints.length===0)
        return;



    let closest=999999;



    routePoints.forEach(point=>{


        let distance =

        map.distance(

            currentPos,

            point

        );



        if(distance < closest){

            closest=distance;

        }


    });





    // Mehr als 80 Meter weg

    if(closest > 80){



        autoRecalculate();


    }


}







// ------------------------------
// Neue Route berechnen
// ------------------------------

async function autoRecalculate(){


    if(recalculating)
        return;



    let now=

    Date.now();



    // nicht zu oft neu rechnen

    if(now-lastRecalculate < 10000)

        return;



    lastRecalculate=now;



    recalculating=true;



    speak(

        "Sie haben die Route verlassen. Neue Route wird berechnet."

    );



    updateStatus(

        "🔄 Neue Route wird gesucht..."

    );





    try{


        await calculateRoute();



        speak(

            "Neue Route wurde berechnet."

        );



    }


    catch(error){


        speak(

            "Die Route konnte nicht neu berechnet werden."

        );


    }




    recalculating=false;


}








// ------------------------------
// GPS Genauigkeit melden
// ------------------------------

function gpsAccuracyMessage(accuracy){



    if(accuracy < 10){


        return "GPS Signal sehr genau";


    }



    if(accuracy < 30){


        return "GPS Signal gut";


    }



    if(accuracy < 100){


        return "GPS Signal ungenau";


    }



    return "GPS Signal schwach";


}








// ------------------------------
// GPS Status Ansage
// ------------------------------

function speakGPSStatus(accuracy){


    speak(

        gpsAccuracyMessage(

            accuracy

        )

    );


}








// ------------------------------
// Navigation aktiv halten
// ------------------------------

function navigationTick(){


    if(!navigationStarted)

        return;



    checkRouteLost();



    if(steps &&
       steps.length>0){



        let step=

        steps[nextInstruction];



        if(step){



            let distance=

            map.distance(

                currentPos,

                step.location

            );



            checkVoiceDistance(

                step,

                distance

            );


        }


    }


}






// jede Sekunde prüfen

setInterval(

navigationTick,

1000

);
// =====================================
// logik.js
// Teil 5/5
// Abschluss + Hilfsfunktionen
// =====================================



// ------------------------------
// Navigation stoppen
// ------------------------------

function stopNavigation(){


    navigationStarted=false;


    resetVoiceFlags();



    speak(

        "Navigation beendet."

    );


    setInstruction(

        "Navigation gestoppt"

    );


}






// ------------------------------
// Navigation pausieren
// ------------------------------

function pauseNavigation(){


    navigationStarted=false;


    speak(

        "Navigation pausiert."

    );


}






// ------------------------------
// Navigation fortsetzen
// ------------------------------

function resumeNavigation(){


    navigationStarted=true;


    followLocation=true;


    speak(

        "Navigation fortgesetzt."

    );


}








// ------------------------------
// Entfernung sprechen
// ------------------------------

function speakDistance(distance){


    let text="";



    if(distance>=1000){


        text =

        (

            distance/1000

        ).toFixed(1)

        +

        " Kilometer";


    }

    else{


        text =

        Math.round(distance)

        +

        " Meter";


    }




    speak(text);


}








// ------------------------------
// Zeitansage
// ------------------------------

function speakTime(minutes){


    if(minutes<60){


        speak(

            "Noch ungefähr "

            +

            minutes

            +

            " Minuten"

        );


    }

    else{


        let hours=

        Math.floor(minutes/60);



        let rest=

        minutes%60;



        speak(

            "Noch ungefähr "

            +

            hours

            +

            " Stunden und "

            +

            rest

            +

            " Minuten"

        );


    }


}








// ------------------------------
// Sicherheitsprüfung
// ------------------------------


function checkSecureConnection(){


    if(location.protocol==="https:"){


        console.log(

            "Sichere Verbindung"

        );


    }

    else{


        console.log(

            "Hinweis: HTTPS empfohlen für GPS"

        );


    }


}






// ------------------------------
// Standort wird NICHT gespeichert
// ------------------------------

function privacyInfo(){


    return (

        "Der Standort wird nur für die Navigation im Browser verwendet."

        +

        " Es gibt keine Speicherung durch diese Datei."

    );


}








// ------------------------------
// Begrüßung
// ------------------------------

function startMessage(){


    const messages=[


        "Willkommen. Ihre Navigation ist bereit.",

        "GPS Navigation gestartet.",

        "Bereit für die Routensuche."


    ];



    speak(

        randomWord(messages)

    );


}








// ------------------------------
// Datei geladen
// ------------------------------

checkSecureConnection();


console.log(

    "logik.js vollständig geladen"

);
