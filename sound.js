/* =========================================
   Ghost Studio DAW
   sound.js Teil 1/4

   Web Audio Engine
========================================= */

const AudioEngine = {

    ctx:null,
    master:null,
    initialized:false,


    init(){

        if(this.initialized) return;

        this.ctx = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();


        this.master=this.ctx.createGain();

        this.master.gain.value=0.8;

        this.master.connect(
            this.ctx.destination
        );


        this.initialized=true;

    },


    now(){

        return this.ctx.currentTime;

    },


    createADSR(
        gain,
        time,
        attack=0.01,
        decay=0.2,
        sustain=0.6,
        release=0.5
    ){

        gain.gain.cancelScheduledValues(time);


        gain.gain.setValueAtTime(
            0,
            time
        );


        gain.gain.linearRampToValueAtTime(
            1,
            time+attack
        );


        gain.gain.linearRampToValueAtTime(
            sustain,
            time+attack+decay
        );


        gain.gain.setValueAtTime(
            sustain,
            time+attack+decay
        );


        gain.gain.linearRampToValueAtTime(
            0,
            time+attack+
            decay+
            release
        );

    }

};


/* =========================================
   Allgemeiner Oszillator Sound
========================================= */

function oscillatorSound(
    frequency,
    duration=1,
    type="sine",
    volume=0.5
){

    AudioEngine.init();


    const ctx=AudioEngine.ctx;


    const osc=ctx.createOscillator();

    const gain=ctx.createGain();


    osc.type=type;

    osc.frequency.value=frequency;


    gain.gain.value=0;


    osc.connect(gain);

    gain.connect(
        AudioEngine.master
    );


    const t=ctx.currentTime;


    AudioEngine.createADSR(
        gain,
        t,
        0.02,
        0.2,
        volume,
        0.4
    );


    osc.start(t);


    osc.stop(
        t+duration+0.5
    );

}



/* =========================================
   FM SYNTH
========================================= */


function fmSound(
    frequency,
    duration=0.5,
    amount=80
){

    AudioEngine.init();


    const ctx=AudioEngine.ctx;


    const carrier=
        ctx.createOscillator();


    const modulator=
        ctx.createOscillator();


    const modGain=
        ctx.createGain();


    const gain=
        ctx.createGain();



    carrier.type="sine";

    modulator.type="sine";


    carrier.frequency.value=
        frequency;


    modulator.frequency.value=
        frequency*2;



    modGain.gain.value=
        amount;



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
        AudioEngine.master
    );


    const t=
        ctx.currentTime;


    AudioEngine.createADSR(
        gain,
        t,
        0.005,
        0.15,
        0.5,
        0.3
    );


    carrier.start(t);

    modulator.start(t);


    carrier.stop(
        t+duration
    );

    modulator.stop(
        t+duration
    );

}
/* =========================================
   Ghost Studio DAW
   sound.js Teil 2/4

   Gitarre + Drums + Piano
========================================= */


/* =========================================
   GITARRE
   gezupfter Charakter
========================================= */


function guitarSound(note){

    AudioEngine.init();

    const ctx=AudioEngine.ctx;


    const frequencies=[

        82.41,   // E
        110.00,  // A
        146.83,  // D
        196.00,  // G
        246.94   // B

    ];


    let freq=
        frequencies[note % frequencies.length];


    const osc=
        ctx.createOscillator();


    const harmonic=
        ctx.createOscillator();


    const gain=
        ctx.createGain();


    osc.type="triangle";

    harmonic.type="sine";


    osc.frequency.value=freq;

    harmonic.frequency.value=
        freq*2;



    const harmonicGain=
        ctx.createGain();


    harmonicGain.gain.value=0.25;



    harmonic.connect(
        harmonicGain
    );


    harmonicGain.connect(
        gain
    );


    osc.connect(
        gain
    );


    gain.connect(
        AudioEngine.master
    );


    const t=
        ctx.currentTime;


    gain.gain.setValueAtTime(
        0,
        t
    );


    gain.gain.linearRampToValueAtTime(
        0.8,
        t+0.02
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        t+1.5
    );


    osc.start(t);

    harmonic.start(t);


    osc.stop(
        t+1.6
    );

    harmonic.stop(
        t+1.6
    );

}



/* =========================================
   WHITE NOISE GENERATOR
========================================= */


function noiseSound(
    duration=0.5,
    volume=0.5
){

    AudioEngine.init();


    const ctx=
        AudioEngine.ctx;


    const buffer=
        ctx.createBuffer(
            1,
            ctx.sampleRate*duration,
            ctx.sampleRate
        );


    const data=
        buffer.getChannelData(0);


    for(
        let i=0;
        i<data.length;
        i++
    ){

        data[i]=
            Math.random()*2-1;

    }


    const source=
        ctx.createBufferSource();


    const filter=
        ctx.createBiquadFilter();


    const gain=
        ctx.createGain();


    source.buffer=buffer;


    filter.type="highpass";

    filter.frequency.value=1500;


    gain.gain.value=volume;


    source.connect(filter);

    filter.connect(gain);

    gain.connect(
        AudioEngine.master
    );


    source.start();

}



/* =========================================
   DEEP KICK
   Pitch Drop
========================================= */


function kickSound(){

    AudioEngine.init();


    const ctx=
        AudioEngine.ctx;


    const osc=
        ctx.createOscillator();


    const gain=
        ctx.createGain();



    osc.type="sine";


    const t=
        ctx.currentTime;


    osc.frequency.setValueAtTime(
        150,
        t
    );


    osc.frequency.exponentialRampToValueAtTime(
        45,
        t+0.35
    );



    gain.gain.setValueAtTime(
        1,
        t
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        t+0.5
    );


    osc.connect(gain);

    gain.connect(
        AudioEngine.master
    );


    osc.start(t);

    osc.stop(
        t+0.6
    );

}



/* =========================================
   SNARE
========================================= */


function snareSound(){

    noiseSound(
        0.25,
        0.7
    );


    oscillatorSound(
        180,
        0.2,
        "triangle",
        0.3
    );

}



/* =========================================
   HI HAT
========================================= */


function hatSound(){

    noiseSound(
        0.08,
        0.35
    );

}



/* =========================================
   PIANO
   2 Oktaven chromatisch
========================================= */


const pianoNotes=[];


(function(){

    const base=261.63;


    for(
        let i=0;
        i<15;
        i++
    ){

        pianoNotes.push(
            base*
            Math.pow(
                2,
                i/12
            )
        );

    }

})();



function pianoSound(index){

    AudioEngine.init();


    const ctx=
        AudioEngine.ctx;


    const freq=
        pianoNotes[
            index % pianoNotes.length
        ];



    for(
        let i=0;
        i<3;
        i++
    ){

        const osc=
            ctx.createOscillator();


        const gain=
            ctx.createGain();


        osc.type=
            i===0
            ?
            "triangle"
            :
            "sine";


        osc.frequency.value=
            freq+
            (i-1)*1.5;


        gain.gain.value=
            0.25;



        osc.connect(gain);

        gain.connect(
            AudioEngine.master
        );


        const t=
            ctx.currentTime;


        gain.gain.setValueAtTime(
            0,
            t
        );


        gain.gain.linearRampToValueAtTime(
            0.5,
            t+0.01
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            t+2
        );


        osc.start(t);

        osc.stop(
            t+2.1
        );

    }

}
/* =========================================
   Ghost Studio DAW
   sound.js Teil 3/4

   FM Beats + FX + Mikrofon Recorder
========================================= */


/* =========================================
   ELEKTRISCHE FM BEATS
   20 verschiedene Sounds
========================================= */


const electroSounds=[];


function createElectroSounds(){

    electroSounds.length=0;


    const names=[

        "FM Bass",
        "Cyber Hit",
        "Digital Pluck",
        "Space FX",
        "Laser",
        "Synth Kick",
        "Glitch",
        "Future Pad",
        "Robot",
        "Pulse",
        "Deep FM",
        "Crystal",
        "Dark Wave",
        "Neon",
        "Voltage",
        "Machine",
        "Echo",
        "Alien",
        "Hyper",
        "Energy"

    ];


    names.forEach(
        (name,index)=>{

            electroSounds.push({

                name:name,

                play(){

                    fmSound(

                        80+
                        index*25,

                        0.3+
                        index%4*0.1,

                        40+
                        index*8

                    );

                }

            });

        }
    );

}


createElectroSounds();



function playElectro(index){

    if(
        electroSounds[index]
    ){

        electroSounds[index].play();

    }

}



/* =========================================
   GENERISCHER SOUND PLAYER
========================================= */


function playSoundObject(sound){

    if(!sound)
        return;


    switch(sound.type){


        case "guitar":

            guitarSound(
                sound.id
            );

        break;



        case "piano":

            pianoSound(
                sound.id
            );

        break;



        case "kick":

            kickSound();

        break;



        case "snare":

            snareSound();

        break;



        case "hat":

            hatSound();

        break;



        case "electro":

            playElectro(
                sound.id
            );

        break;



        case "voice":

            playVoice(
                sound
            );

        break;


    }

}





/* =========================================
   MIKROFON RECORDER
========================================= */


let recorder=null;

let recordingChunks=[];

let voiceCounter=1;


async function startRecording(){

    const stream=
        await navigator.mediaDevices
        .getUserMedia({

            audio:true

        });



    recorder=
        new MediaRecorder(stream);


    recordingChunks=[];


    recorder.ondataavailable=
        e=>{

            recordingChunks.push(
                e.data
            );

        };



    recorder.onstop=
        ()=>{


            const blob=
                new Blob(
                    recordingChunks,
                    {
                        type:
                        "audio/webm"
                    }
                );


            const url=
                URL.createObjectURL(
                    blob
                );


            addVoiceToPool({

                name:
                "Stimme "+
                voiceCounter++,


                url:url,


                type:
                "voice"

            });


        };



    recorder.start();


}



function stopRecording(){

    if(
        recorder &&
        recorder.state!=="inactive"
    ){

        recorder.stop();

    }

}




/* =========================================
   STIMME ABSPIELEN
========================================= */


function playVoice(sound){

    if(!sound.url)
        return;


    const audio=
        new Audio(
            sound.url
        );


    audio.play();

}



/* =========================================
   VOICE POOL DATEN
========================================= */


window.voiceSounds=[];


function addVoiceToPool(sound){

    voiceSounds.push(sound);


    if(
        typeof refreshVoiceList
        ==="function"
    ){

        refreshVoiceList();

    }

}
/* =========================================
   Ghost Studio DAW
   sound.js Teil 4/4

   Timeline Audio Controls
   Pitch / Volume / Playback
========================================= */


/* =========================================
   AUDIO BUFFER LADEN
========================================= */


async function loadAudioBuffer(url){

    AudioEngine.init();


    const response =
        await fetch(url);


    const arrayBuffer =
        await response.arrayBuffer();


    return await AudioEngine.ctx
        .decodeAudioData(
            arrayBuffer
        );

}



/* =========================================
   BUFFER PLAYER
========================================= */


function playBufferSound(
    buffer,
    options={}
){

    AudioEngine.init();


    const ctx =
        AudioEngine.ctx;


    const source =
        ctx.createBufferSource();


    const gain =
        ctx.createGain();



    source.buffer =
        buffer;



    source.playbackRate.value =
        options.pitch ||
        1;



    gain.gain.value =
        options.volume ??
        1;



    source.connect(gain);

    gain.connect(
        AudioEngine.master
    );



    const start =
        options.start ||
        0;



    source.start(
        ctx.currentTime + start
    );


    return source;

}




/* =========================================
   PITCH MODIFIER

   Tief / Normal / Hoch
========================================= */


function pitchValue(mode){

    switch(mode){


        case "low":

            return 0.5;



        case "high":

            return 2;



        default:

            return 1;

    }

}



/* =========================================
   TIMELINE SOUND OBJEKT
========================================= */


function createSoundObject(
    type,
    id,
    name
){

    return {

        id:id,

        type:type,

        name:name,


        start:0,


        duration:1,


        volume:1,


        pitch:"normal"

    };

}



/* =========================================
   SOUNDPOOL STANDARD DATEN
========================================= */


window.soundPoolData=[


    {
        name:"Gitarre E",
        type:"guitar",
        id:0
    },

    {
        name:"Gitarre A",
        type:"guitar",
        id:1
    },

    {
        name:"Gitarre D",
        type:"guitar",
        id:2
    },

    {
        name:"Gitarre G",
        type:"guitar",
        id:3
    },

    {
        name:"Gitarre B",
        type:"guitar",
        id:4
    }



];



for(
    let i=0;
    i<15;
    i++
){

    soundPoolData.push({

        name:
        "Piano Note "+
        (i+1),

        type:"piano",

        id:i

    });

}



soundPoolData.push(

    {
        name:"Deep Kick",
        type:"kick",
        id:0
    },

    {
        name:"Snare",
        type:"snare",
        id:0
    },

    {
        name:"Hi Hat",
        type:"hat",
        id:0
    }

);



for(
    let i=0;
    i<20;
    i++
){

    soundPoolData.push({

        name:
        "FM Beat "+
        (i+1),

        type:"electro",

        id:i

    });

}



/* =========================================
   MASTER LAUTSTÄRKE
========================================= */


function setMasterVolume(value){

    AudioEngine.init();


    AudioEngine.master.gain.value =
        value;

}



/* =========================================
   STOP ALL
========================================= */


let activeSources=[];


function stopAllSounds(){

    activeSources.forEach(
        source=>{

            try{

                source.stop();

            }
            catch(e){}

        }
    );


    activeSources=[];

}



/* =========================================
   EXPORT
========================================= */


window.AudioEngine =
    AudioEngine;

window.playSoundObject =
    playSoundObject;

window.startRecording =
    startRecording;

window.stopRecording =
    stopRecording;

window.soundPoolData =
    soundPoolData;

window.pitchValue =
    pitchValue;

window.createSoundObject =
    createSoundObject;
