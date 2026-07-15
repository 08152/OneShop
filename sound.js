/* =========================================
   Ghost Studio DAW
   sound.js Teil 1/4

   Web Audio API Engine

   Keine MP3
   Keine WAV
   Nur Synthese
========================================= */



let audioContext;



let masterGain;



let voiceSounds=[];




/* =========================================
   AUDIO START
========================================= */


function initAudio(){


if(audioContext)
return;



audioContext =
new AudioContext();



masterGain =
audioContext.createGain();



masterGain.gain.value =
0.8;



masterGain.connect(
audioContext.destination
);



}







/* =========================================
   AUDIO AKTIVIEREN
========================================= */


function ensureAudio(){


initAudio();



if(
audioContext.state==="suspended"
){

audioContext.resume();

}


}









/* =========================================
   OSCILLATOR HELFER
========================================= */


function createOsc(
type,
frequency,
time,
duration,
volume,
destination
){



let osc =
audioContext.createOscillator();



let gain =
audioContext.createGain();



osc.type =
type;



osc.frequency
.setValueAtTime(
frequency,
time
);





gain.gain
.setValueAtTime(
0,
time
);





/*
ADSR
Attack
Decay
Sustain
Release
*/


gain.gain
.linearRampToValueAtTime(
volume,
time+0.02
);



gain.gain
.exponentialRampToValueAtTime(
volume*0.6,
time+0.15
);



gain.gain
.setValueAtTime(
volume*0.6,
time+duration-0.1
);



gain.gain
.exponentialRampToValueAtTime(
0.001,
time+duration
);





osc.connect(
gain
);



gain.connect(
destination
);



osc.start(
time
);



osc.stop(
time+duration
);



}








/* =========================================
   DETUNED OSCILLATOR
========================================= */


function detunedNote(
frequency,
time,
duration,
volume
){



createOsc(
"sine",
frequency,
time,
duration,
volume,
masterGain
);



createOsc(
"triangle",
frequency*1.005,
time,
duration,
volume*0.5,
masterGain
);



createOsc(
"sawtooth",
frequency*0.995,
time,
duration,
volume*0.25,
masterGain
);



}








/* =========================================
   FREQUENZ TABELLE
========================================= */


const noteFrequencies={


"C4":261.63,

"C#4":277.18,

"D4":293.66,

"D#4":311.13,

"E4":329.63,

"F4":349.23,

"F#4":369.99,

"G4":392.00,

"G#4":415.30,

"A4":440,

"A#4":466.16,

"B4":493.88,


"C5":523.25,

"D5":587.33,

"E5":659.25

};






/* =========================================
   MASTER START
========================================= */


document.addEventListener(
"click",
()=>{


ensureAudio();


},
{
once:true
});
/* =========================================
   Ghost Studio DAW
   sound.js Teil 2/4

   Piano
   Gitarre
   Drums

   Alles Web Audio Synthese
========================================= */







/* =========================================
   PIANO
   15 chromatische Noten
========================================= */


function playPiano(note){


ensureAudio();



let frequency =
noteFrequencies[note];



if(!frequency)
return;



let now =
audioContext.currentTime;



/*
Fetter Klavierklang:
mehrere Layer
*/


detunedNote(
frequency,
now,
1.8,
0.35
);



createOsc(
"triangle",
frequency*2,
now,
1.5,
0.15,
masterGain
);



createOsc(
"sine",
frequency*0.5,
now,
2,
0.15,
masterGain
);



}








/* =========================================
   GITARRE
   gezupfter Charakter
========================================= */


function playGuitar(stringID){


ensureAudio();



const strings=[


82.41,

110.00,

146.83,

196.00,

246.94


];



let freq =
strings[stringID]
||
strings[0];



let now =
audioContext.currentTime;



let osc =
audioContext.createOscillator();



let gain =
audioContext.createGain();



osc.type =
"triangle";



osc.frequency
.setValueAtTime(
freq,
now
);




/*
Schneller Anschlag
*/


gain.gain
.setValueAtTime(
0,
now
);



gain.gain
.linearRampToValueAtTime(
0.45,
now+0.01
);



gain.gain
.exponentialRampToValueAtTime(
0.001,
now+1
);





osc.connect(
gain
);



gain.connect(
masterGain
);



osc.start(
now
);



osc.stop(
now+1
);




/*
Oberton
*/


createOsc(
"sine",
freq*3,
now,
0.5,
0.1,
masterGain
);



}









/* =========================================
   WHITE NOISE
========================================= */


function createNoise(
duration,
volume
){



let buffer =
audioContext
.createBuffer(
1,
audioContext.sampleRate*
duration,
audioContext.sampleRate
);



let data =
buffer.getChannelData(
0
);



for(
let i=0;
i<data.length;
i++
){


data[i] =
Math.random()*2-1;


}




let source =
audioContext.createBufferSource();



let gain =
audioContext.createGain();



source.buffer =
buffer;



gain.gain.value =
volume;



source.connect(
gain
);



gain.connect(
masterGain
);



source.start();



}









/* =========================================
   KICK
   Pitch Drop
========================================= */


function playKick(){


ensureAudio();



let now =
audioContext.currentTime;



let osc =
audioContext.createOscillator();



let gain =
audioContext.createGain();



osc.type =
"sine";



osc.frequency
.setValueAtTime(
140,
now
);



osc.frequency
.exponentialRampToValueAtTime(
45,
now+0.4
);




gain.gain
.setValueAtTime(
1,
now
);



gain.gain
.exponentialRampToValueAtTime(
0.001,
now+0.5
);





osc.connect(
gain
);



gain.connect(
masterGain
);



osc.start(
now
);



osc.stop(
now+0.5
);



}









/* =========================================
   SNARE
========================================= */


function playSnare(){


ensureAudio();



createNoise(
0.25,
0.5
);



let now =
audioContext.currentTime;



createOsc(
"triangle",
180,
now,
0.2,
0.2,
masterGain
);



}









/* =========================================
   HI HAT
========================================= */


function playHat(){


ensureAudio();



createNoise(
0.08,
0.25
);



}
/* =========================================
   Ghost Studio DAW
   sound.js Teil 3/4

   FM Synth
   FX Sounds
   Soundpool
========================================= */






/* =========================================
   FM SYNTH ENGINE
========================================= */


function playFM(
frequency,
duration=0.4,
volume=0.4
){


ensureAudio();



let now =
audioContext.currentTime;



let carrier =
audioContext.createOscillator();



let modulator =
audioContext.createOscillator();



let modGain =
audioContext.createGain();



let gain =
audioContext.createGain();





carrier.type =
"sawtooth";



modulator.type =
"sine";



carrier.frequency
.value =
frequency;



modulator.frequency
.value =
frequency*2;





modGain.gain
.value =
frequency*1.5;




modulator.connect(
modGain
);



modGain.connect(
carrier.frequency
);



carrier.connect(
gain
);



gain.connect(
masterGain
);





gain.gain
.setValueAtTime(
0,
now
);



gain.gain
.linearRampToValueAtTime(
volume,
now+0.02
);



gain.gain
.exponentialRampToValueAtTime(
0.001,
now+duration
);





carrier.start(
now
);



modulator.start(
now
);



carrier.stop(
now+duration
);



modulator.stop(
now+duration
);



}









/* =========================================
   ELECTRO FX
========================================= */


function playElectro(id){


let sounds=[


110,
140,
180,
220,
260,
300,
340,
390,
440,
520,
600,
700,
800,
900,
1000,
1200,
1400,
1600,
1800,
2200

];



let freq =
sounds[id]
||
440;



playFM(
freq,
0.5,
0.35
);



}









/* =========================================
   SOUNDPOOL
========================================= */


const soundPoolData=[



/* GITARRE */


{
name:"Gitarre Saite 1",
type:"guitar",
id:0
},


{
name:"Gitarre Saite 2",
type:"guitar",
id:1
},


{
name:"Gitarre Saite 3",
type:"guitar",
id:2
},


{
name:"Gitarre Saite 4",
type:"guitar",
id:3
},


{
name:"Gitarre Saite 5",
type:"guitar",
id:4
},







/* DRUMS */


{
name:"Deep Kick",
type:"kick"
},


{
name:"Snare",
type:"snare"
},


{
name:"Hi Hat",
type:"hat"
},







/* PIANO */


{
name:"Piano C4",
type:"piano",
note:"C4"
},


{
name:"Piano D4",
type:"piano",
note:"D4"
},


{
name:"Piano E4",
type:"piano",
note:"E4"
},


{
name:"Piano F4",
type:"piano",
note:"F4"
},


{
name:"Piano G4",
type:"piano",
note:"G4"
},


{
name:"Piano A4",
type:"piano",
note:"A4"
},


{
name:"Piano C5",
type:"piano",
note:"C5"
},


{
name:"Piano D5",
type:"piano",
note:"D5"
},


{
name:"Piano E5",
type:"piano",
note:"E5"
},








/* ELECTRO */


{
name:"FM Beat 1",
type:"electro",
id:0
},


{
name:"FM Beat 2",
type:"electro",
id:1
},


{
name:"FM Beat 3",
type:"electro",
id:2
},


{
name:"FM Beat 4",
type:"electro",
id:3
},


{
name:"FM Beat 5",
type:"electro",
id:4
}



];









/* =========================================
   SOUND ABSPIELEN
========================================= */


function playSoundObject(
sound
){


ensureAudio();



switch(
sound.type
){



case "guitar":

playGuitar(
sound.id
);

break;




case "piano":

playPiano(
sound.note
);

break;




case "kick":

playKick();

break;




case "snare":

playSnare();

break;




case "hat":

playHat();

break;




case "electro":

playElectro(
sound.id
);

break;



}



}
/* =========================================
   Ghost Studio DAW
   sound.js Teil 4/4

   Recorder
   Voice Pool
   Audio Modifikation
========================================= */







let mediaRecorder = null;

let recordedChunks = [];

let voiceCounter = 1;








/* =========================================
   MIKROFON START
========================================= */


async function startRecording(){


try{


const stream =
await navigator.mediaDevices
.getUserMedia({

audio:true

});





mediaRecorder =
new MediaRecorder(
stream
);



recordedChunks=[];




mediaRecorder.ondataavailable =
e=>{


if(
e.data.size>0
){

recordedChunks.push(
e.data
);

}


};






mediaRecorder.onstop =
()=>{


createVoiceSound();


};





mediaRecorder.start();



}

catch(error){


alert(
"Mikrofon konnte nicht gestartet werden"
);


}



}









/* =========================================
   STOP RECORDING
========================================= */


function stopRecording(){


if(
mediaRecorder &&
mediaRecorder.state==="recording"
){


mediaRecorder.stop();


}



}









/* =========================================
   STIMME SPEICHERN
========================================= */


function createVoiceSound(){



const blob =
new Blob(
recordedChunks,
{
type:"audio/webm"
}
);



const url =
URL.createObjectURL(
blob
);




let voice={


name:
"Stimme "+voiceCounter,


type:
"voice",



url:
url,



volume:
1,


pitch:
1,


speed:
1



};




voiceCounter++;




voiceSounds.push(
voice
);





if(
typeof refreshVoiceList==="function"
){

refreshVoiceList();

}



}









/* =========================================
   STIMME ABSPIELEN
========================================= */


function playVoice(
voice
){



ensureAudio();



let source =
audioContext
.createMediaElementSource(
new Audio(
voice.url
)
);



let gain =
audioContext.createGain();



gain.gain.value =
voice.volume
||
1;




source.connect(
gain
);



gain.connect(
masterGain
);



source.mediaElement.play();



}









/* =========================================
   PLAYBACK MODIFIKATION
========================================= */


function applySoundSettings(
audio,
settings
){



if(
settings.volume
!==undefined
){


audio.volume =
settings.volume;


}





if(
settings.speed
!==undefined
){


audio.playbackRate =
settings.speed;


}




/*
Pitch bei MediaAudio:
wird über playbackRate
simuliert
*/


if(
settings.pitch
!==undefined
){


audio.playbackRate *=
settings.pitch;


}



}









/* =========================================
   ERWEITERTE PLAY-FUNKTION
========================================= */


function playVoiceAdvanced(
voice,
settings={}
){



let audio =
new Audio(
voice.url
);



applySoundSettings(
audio,
{

volume:
settings.volume
||
voice.volume,


speed:
settings.speed
||
voice.speed,


pitch:
settings.pitch
||
voice.pitch


}
);



audio.play();



}
