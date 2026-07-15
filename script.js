/* =========================================
   Ghost Studio DAW
   script.js Teil 1/4

   Neues System:
   Sound auswählen
   -> DRAG klicken
   -> Sekunde wählen
   -> Spur wählen
   -> Einfügen
========================================= */


let tracks = [];

let timelineObjects = [];

let selectedPoolSound = null;

let selectedBlock = null;

let timelineLength = 30;



const statusText =
document.getElementById(
    "statusText"
);



/* =========================================
   START
========================================= */


window.addEventListener(
"DOMContentLoaded",
()=>{


    createTracks();

    createTimeScale();

    loadSoundPool();



    document
    .getElementById(
        "timelineLength"
    )
    .addEventListener(
    "change",
    e=>{


        timelineLength =
        Number(
            e.target.value
        );


        createTimeScale();


    });



});





/* =========================================
   TRACK SYSTEM
========================================= */


function createTracks(){


    tracks=[];


    document
    .querySelectorAll(
        ".track"
    )
    .forEach(
    (track,index)=>{


        let lane =
        track.querySelector(
            ".trackLane"
        );


        tracks.push({

            id:index,

            element:track,

            lane:lane

        });


    });



}





function addTrack(){


    let id =
    tracks.length;



    let div =
    document.createElement(
        "div"
    );


    div.className =
    "track";



    div.innerHTML=`

    <div class="trackTitle">
    Track ${id+1}
    </div>


    <div class="trackLane">
    </div>

    `;



    document
    .getElementById(
        "timelineContainer"
    )
    .appendChild(
        div
    );



    let lane =
    div.querySelector(
        ".trackLane"
    );



    tracks.push({

        id:id,

        element:div,

        lane:lane

    });



    document
    .getElementById(
        "trackCount"
    )
    .textContent =
    tracks.length;


}





/* =========================================
   ZEITLEISTE
========================================= */


function createTimeScale(){


let scale =
document.getElementById(
"timeScale"
);



scale.innerHTML="";



for(
let i=0;
i<=timelineLength;
i++
){


let cell =
document.createElement(
"div"
);


cell.className =
"timeCell";


cell.style.width =
"100px";


cell.textContent =
i+"s";



scale.appendChild(
cell
);


}





document
.querySelectorAll(
".trackLane"
)
.forEach(
lane=>{


lane.style.width =
timelineLength *
100+
"px";


});


}





/* =========================================
   SOUNDPOOL
========================================= */


function loadSoundPool(){


const lists={


guitar:
document.getElementById(
"guitarList"
),


piano:
document.getElementById(
"pianoList"
),


drum:
document.getElementById(
"drumList"
),


electro:
document.getElementById(
"electroList"
)


};





soundPoolData.forEach(
sound=>{


let target=null;



if(
sound.type==="guitar"
)
target=lists.guitar;



if(
sound.type==="piano"
)
target=lists.piano;



if(
["kick","snare","hat"]
.includes(
sound.type
)
)
target=lists.drum;



if(
sound.type==="electro"
)
target=lists.electro;




if(!target)
return;





let item =
document.createElement(
"div"
);



item.className =
"soundItem";



item.innerHTML=`

<div class="soundName">
${sound.name}
</div>


<div class="soundButtons">


<button class="previewButton">
▶
</button>


<button class="dragHandle">
DRAG
</button>


</div>

`;





/* Vorschau */


item
.querySelector(
".previewButton"
)
.onclick=()=>{


playSoundObject(
sound
);


};





/* NEU:
DRAG BUTTON
*/


item
.querySelector(
".dragHandle"
)
.onclick=()=>{


openPlaceMenu(
sound
);


};





target.appendChild(
item
);



});



}
/* =========================================
   script.js Teil 2/4

   Sound platzieren
   Timeline Blöcke
========================================= */



/* =========================================
   PLACE MODAL
========================================= */


function openPlaceMenu(sound){


    selectedPoolSound =
    sound;



    document
    .getElementById(
        "placeSoundName"
    )
    .textContent =
    sound.name;



    document
    .getElementById(
        "placeTime"
    )
    .value =
    0;



    document
    .getElementById(
        "placeTrack"
    )
    .value =
    0;



    document
    .getElementById(
        "placeModal"
    )
    .classList
    .remove(
        "hidden"
    );


}






document
.getElementById(
"placeCancel"
)
.onclick=()=>{


document
.getElementById(
"placeModal"
)
.classList
.add(
"hidden"
);


selectedPoolSound=null;


};







/* =========================================
   SOUND EINFÜGEN
========================================= */


document
.getElementById(
"placeConfirm"
)
.onclick=()=>{


if(
!selectedPoolSound
)
return;



let time =
Number(
document
.getElementById(
"placeTime"
)
.value
);



let track =
Number(
document
.getElementById(
"placeTrack"
)
.value
);




addTimelineBlock(

selectedPoolSound,

track,

time

);





document
.getElementById(
"placeModal"
)
.classList
.add(
"hidden"
);



selectedPoolSound=null;



statusText.textContent =
"Sound eingefügt";


};







/* =========================================
   TIMELINE BLOCK
========================================= */


function addTimelineBlock(
sound,
trackID,
start
){



let block =
document.createElement(
"div"
);



block.className =
"timelineBlock";



block.textContent =
sound.name;




let object={


id:
Date.now(),



sound:
sound,



track:
trackID,



start:
start,



volume:
1,



pitch:
1,



speed:
1,



element:
block


};




timelineObjects.push(
object
);





block.style.left =
start *
100+
"px";



block.style.width =
100+
"px";






tracks[trackID]
.lane
.appendChild(
block
);






/*
   Klick auf Sound
   öffnet Editor
*/


block.onclick=()=>{


openEditMenu(
object
);


};





updateSoundCount();



}







function updateSoundCount(){


document
.getElementById(
"soundCount"
)
.textContent =
timelineObjects.length;


}
/* =========================================
   script.js Teil 3/4

   Edit Menü
   Volume
   Pitch
   Speed
   Delete
========================================= */


/* =========================================
   EDIT MODAL ÖFFNEN
========================================= */


function openEditMenu(object){


    selectedBlock =
    object;



    document
    .getElementById(
        "editSoundName"
    )
    .textContent =
    object.sound.name;



    document
    .getElementById(
        "editVolume"
    )
    .value =
    object.volume;



    document
    .getElementById(
        "editPitch"
    )
    .value =
    object.pitch;



    document
    .getElementById(
        "editSpeed"
    )
    .value =
    object.speed;



    updateEditValues();



    document
    .getElementById(
        "editModal"
    )
    .classList
    .remove(
        "hidden"
    );


}






/* =========================================
   WERTE ANZEIGEN
========================================= */


function updateEditValues(){


if(!selectedBlock)
return;



document
.getElementById(
"volumeValue"
)
.textContent =
Number(
selectedBlock.volume
)
.toFixed(2);



document
.getElementById(
"speedValue"
)
.textContent =
selectedBlock.speed
+"x";



}








/* =========================================
   LAUTSTÄRKE
========================================= */


document
.getElementById(
"editVolume"
)
.oninput=()=>{


if(!selectedBlock)
return;



selectedBlock.volume =
Number(
document
.getElementById(
"editVolume"
)
.value
);



updateEditValues();


};








/* =========================================
   TONHÖHE
========================================= */


document
.getElementById(
"editPitch"
)
.onchange=()=>{


if(!selectedBlock)
return;



selectedBlock.pitch =
Number(
document
.getElementById(
"editPitch"
)
.value
);


};








/* =========================================
   GESCHWINDIGKEIT
========================================= */


document
.getElementById(
"editSpeed"
)
.oninput=()=>{


if(!selectedBlock)
return;



selectedBlock.speed =
Number(
document
.getElementById(
"editSpeed"
)
.value
);



updateEditValues();



};








/* =========================================
   SOUND LÖSCHEN
========================================= */


document
.getElementById(
"deleteBlock"
)
.onclick=()=>{


if(!selectedBlock)
return;




selectedBlock
.element
.remove();




timelineObjects =
timelineObjects.filter(
item=>
item.id !==
selectedBlock.id
);




selectedBlock=null;



document
.getElementById(
"editModal"
)
.classList
.add(
"hidden"
);



updateSoundCount();



};







/* =========================================
   EDIT SCHLIESSEN
========================================= */


document
.getElementById(
"closeEdit"
)
.onclick=()=>{


document
.getElementById(
"editModal"
)
.classList
.add(
"hidden"
);



selectedBlock=null;


};
/* =========================================
   script.js Teil 4/4

   Playback
   Playhead
   Recorder
   Final Setup
========================================= */



let playing=false;

let playTimer=null;

let playTime=0;





const playhead =
document.getElementById(
"playhead"
);







/* =========================================
   PLAY
========================================= */


document
.getElementById(
"playBtn"
)
.onclick=()=>{


if(playing)
return;



playing=true;


statusText.textContent =
"Wiedergabe";



let start =
performance.now()
-
playTime*1000;




playTimer =
setInterval(
()=>{


playTime =
(
performance.now()
-
start
)
/1000;



updatePlayhead();




timelineObjects.forEach(
obj=>{


if(
Math.abs(
obj.start-playTime
)
<0.03
){



playSoundObject({

...obj.sound,


volume:
obj.volume,


pitch:
obj.pitch,


speed:
obj.speed


});



}



});





if(
playTime>=timelineLength
){

stopPlayback();

}



},
20
);



};









/* =========================================
   PLAYHEAD
========================================= */


function updatePlayhead(){


playhead.style.left =

120 +

playTime*

100+

"px";


}







/* =========================================
   STOP
========================================= */


document
.getElementById(
"stopBtn"
)
.onclick =
stopPlayback;




function stopPlayback(){


playing=false;



clearInterval(
playTimer
);



playTimer=null;


playTime=0;



updatePlayhead();



statusText.textContent =
"Bereit";


}








/* =========================================
   CLEAR
========================================= */


document
.getElementById(
"clearBtn"
)
.onclick=()=>{


timelineObjects.forEach(
obj=>{


obj.element.remove();


});



timelineObjects=[];



updateSoundCount();


};









/* =========================================
   SPUR HINZUFÜGEN
========================================= */


document
.getElementById(
"addTrackBtn"
)
.onclick=()=>{


addTrack();


};









/* =========================================
   MIKROFON
========================================= */


let recording=false;




document
.getElementById(
"recordBtn"
)
.onclick=
async()=>{



let button =
document
.getElementById(
"recordBtn"
);





if(!recording){



await startRecording();



recording=true;



button.textContent =
"⏹ Aufnahme stoppen";



statusText.textContent =
"Aufnahme läuft";



}

else{



stopRecording();



recording=false;



button.textContent =
"🎤 Aufnahme starten";



statusText.textContent =
"Gespeichert";



}



};









/* =========================================
   STIMMEN SOUNDPOOL
========================================= */


function refreshVoiceList(){


let list =
document
.getElementById(
"voiceList"
);



list.innerHTML="";




voiceSounds.forEach(
voice=>{


let item =
document.createElement(
"div"
);



item.className =
"soundItem";




item.innerHTML=`

<div class="soundName">
${voice.name}
</div>


<div class="soundButtons">


<button class="previewButton">
▶
</button>


<button class="dragHandle">
DRAG
</button>


</div>

`;






item
.querySelector(
".previewButton"
)
.onclick=()=>{


playVoice(
voice
);


};






item
.querySelector(
".dragHandle"
)
.onclick=()=>{


openPlaceMenu(
voice
);


};





list.appendChild(
item
);



});



}








/* =========================================
   START CHECK
========================================= */


window.addEventListener(
"load",
()=>{


statusText.textContent =
"DAW bereit";



createTimeScale();



});
