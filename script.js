/* =========================================
   Ghost Studio DAW
   script.js 1/5

   Sound auswählen →
   Platzierungsfenster →
   Timeline
========================================= */


let tracks = [];

let timelineObjects = [];

let selectedPoolSound = null;

let selectedBlock = null;



let timelineLength = 30;



let isPlaying = false;

let playTime = 0;

let playTimer = null;





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


    connectButtons();



});









/* =========================================
   TRACKS ERSTELLEN
========================================= */


function createTracks(){


    tracks=[];



    document
    .querySelectorAll(
        ".track"
    )
    .forEach(
    (track,index)=>{


        const lane =
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


    const id =
    tracks.length;



    const track =
    document.createElement(
        "div"
    );



    track.className =
    "track";



    track.innerHTML=`

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
        track
    );




    const lane =
    track.querySelector(
        ".trackLane"
    );



    tracks.push({

        id:id,

        element:track,

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
   ZEITLINIE
========================================= */


function createTimeScale(){


    const scale =
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
   Ghost Studio DAW
   script.js 2/5

   Soundpool System
   DRAG -> Platzieren
========================================= */



/* =========================================
   SOUNDPOOL LADEN
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
),


voice:
document.getElementById(
"voiceList"
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
sound.type==="kick" ||
sound.type==="snare" ||
sound.type==="hat"
)
target=lists.drum;



if(
sound.type==="electro"
)
target=lists.electro;



if(
sound.type==="voice"
)
target=lists.voice;





if(!target)
return;





createSoundItem(
sound,
target
);



});



}








/* =========================================
   SOUND ITEM ERSTELLEN
========================================= */


function createSoundItem(
sound,
target
){



const item =
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
DRAG öffnet Menü
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



}










/* =========================================
   PLATZIERUNGS-MENÜ
========================================= */


function openPlaceMenu(
sound
){


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









/* =========================================
   ABBRECHEN
========================================= */


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
   Ghost Studio DAW
   script.js 3/5

   Timeline Sounds
========================================= */



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



let start =
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

start

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
"Sound platziert";


};









/* =========================================
   BLOCK ERSTELLEN
========================================= */


function addTimelineBlock(
sound,
trackID,
start
){



const block =
document.createElement(
"div"
);



block.className =
"timelineBlock";



block.textContent =
sound.name;





const object={


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






/*
Position:
1 Sekunde = 100px
*/


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
*/


block.onclick=()=>{


openEditMenu(
object
);


};





updateSoundCount();



}








/* =========================================
   SOUND COUNT
========================================= */


function updateSoundCount(){


document
.getElementById(
"soundCount"
)
.textContent =
timelineObjects.length;


}
/* =========================================
   Ghost Studio DAW
   script.js 4/5

   Edit System
========================================= */



/* =========================================
   EDIT MENÜ ÖFFNEN
========================================= */


function openEditMenu(
object
){


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
   ANZEIGE AKTUALISIEREN
========================================= */


function updateEditValues(){


if(
!selectedBlock
)
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
selectedBlock.speed+
"x";



}









/* =========================================
   LAUTSTÄRKE
========================================= */


document
.getElementById(
"editVolume"
)
.oninput=()=>{


if(
!selectedBlock
)
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
   HÖHE / PITCH
========================================= */


document
.getElementById(
"editPitch"
)
.onchange=()=>{


if(
!selectedBlock
)
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


if(
!selectedBlock
)
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
   LÖSCHEN
========================================= */


document
.getElementById(
"deleteBlock"
)
.onclick=()=>{


if(
!selectedBlock
)
return;




selectedBlock
.element
.remove();




timelineObjects =
timelineObjects.filter(
obj=>
obj.id !==
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
   SCHLIESSEN
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
   Ghost Studio DAW
   script.js 5/5

   Playback
   Recorder
   Final Setup
========================================= */



let playing = false;

let playPosition = 0;

let playTimer = null;



const playhead =
document.getElementById(
"playhead"
);






/* =========================================
   ABSPIELEN
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



let startTime =
performance.now()
-
playPosition*1000;




playTimer =
setInterval(
()=>{


playPosition =
(
performance.now()
-
startTime
)
/1000;




updatePlayhead();





timelineObjects.forEach(
obj=>{


if(
Math.abs(
obj.start-playPosition
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
playPosition >=
timelineLength
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

playPosition *
100+

"px";


}









/* =========================================
   STOPP
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


playPosition=0;



updatePlayhead();



statusText.textContent =
"Bereit";



}









/* =========================================
   TIMELINE LEEREN
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



const btn =
document
.getElementById(
"recordBtn"
);




if(!recording){


await startRecording();



recording=true;



btn.textContent =
"⏹ Aufnahme stoppen";



statusText.textContent =
"Aufnahme läuft";


}

else{


stopRecording();



recording=false;



btn.textContent =
"🎤 Aufnahme starten";



statusText.textContent =
"Aufnahme gespeichert";


}



};









/* =========================================
   VOICE POOL AKTUALISIEREN
========================================= */


function refreshVoiceList(){


const list =
document
.getElementById(
"voiceList"
);



list.innerHTML="";




voiceSounds.forEach(
voice=>{


const item =
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
   TASTEN
========================================= */


window.addEventListener(
"keydown",
e=>{


if(
e.code==="Space"
){

e.preventDefault();



if(playing)
stopPlayback();

else
document
.getElementById(
"playBtn"
)
.click();


}



if(
e.code==="Escape"
){


document
.getElementById(
"placeModal"
)
.classList
.add(
"hidden"
);



document
.getElementById(
"editModal"
)
.classList
.add(
"hidden"
);



}



});








/* =========================================
   FERTIG
========================================= */


window.addEventListener(
"load",
()=>{


createTimeScale();



statusText.textContent =
"Ghost Studio bereit";


});
