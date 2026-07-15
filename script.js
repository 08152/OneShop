/* =========================================
   Ghost Studio DAW
   script.js Teil 1/4

   Grundsystem
   Soundpool
   Timeline
========================================= */


let tracks = [];

let timelineLength = 30;

let timelineObjects = [];

let selectedBlock = null;

let isPlaying = false;

let playTimer = null;

let playPosition = 0;



const timelineContainer =
    document.getElementById(
        "timelineContainer"
    );


const workspace =
    document.getElementById(
        "workspace"
    );


const playhead =
    document.getElementById(
        "playhead"
    );


const statusText =
    document.getElementById(
        "statusText"
    );



/* =========================================
   INITIALISIERUNG
========================================= */


window.addEventListener(
    "DOMContentLoaded",
    ()=>{


        createDefaultTracks();

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

            }
        );


    }
);



/* =========================================
   SPUREN
========================================= */


function createDefaultTracks(){


    tracks=[];


    document
    .querySelectorAll(
        ".track"
    )
    .forEach(
        (track,index)=>{

            tracks.push({

                id:index,

                element:track,

                lane:
                track.querySelector(
                    ".trackLane"
                )

            });


            setupDropZone(
                track.querySelector(
                    ".trackLane"
                ),
                index
            );

        }
    );


}



function addTrack(){


    const id =
        tracks.length;


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "track";


    div.dataset.track=id;



    div.innerHTML=`

        <div class="trackTitle">
            Track ${id+1}
        </div>

        <div class="trackLane"></div>

    `;



    timelineContainer.appendChild(
        div
    );


    const lane =
        div.querySelector(
            ".trackLane"
        );


    tracks.push({

        id:id,

        element:div,

        lane:lane

    });



    setupDropZone(
        lane,
        id
    );



    document
    .getElementById(
        "trackCount"
    )
    .textContent =
        tracks.length;


}



/* =========================================
   ZEITSKALA
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

        const cell =
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
                timelineLength*
                100+
                "px";

        }
    );

}


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
        )

    };



    soundPoolData.forEach(
        sound=>{


            let target;



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
                .includes(sound.type)
            )
                target=lists.drum;



            if(
                sound.type==="electro"
            )
                target=lists.electro;



            if(!target)
                return;



            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "soundItem";


            item.draggable=true;



            item.innerHTML=`

                <div class="soundName">
                    ${sound.name}
                </div>

                <div class="soundButtons">

                    <button class="previewButton">
                    ▶
                    </button>

                    <div class="dragHandle">
                    DRAG
                    </div>

                </div>

            `;



            item.querySelector(
                ".previewButton"
            )
            .onclick=()=>{

                playSoundObject(
                    sound
                );

            };



            item.addEventListener(
                "dragstart",
                e=>{

                    e.dataTransfer.setData(
                        "sound",
                        JSON.stringify(
                            sound
                        )
                    );

                }
            );



            target.appendChild(
                item
            );


        }
    );


}
/* =========================================
   script.js Teil 2/4

   Drag & Drop Timeline
   Sound Blöcke
========================================= */


/* =========================================
   DROP ZONE
========================================= */


function setupDropZone(
    lane,
    trackID
){


    lane.addEventListener(
        "dragover",
        e=>{

            e.preventDefault();

            lane.classList.add(
                "dragOver"
            );

        }
    );



    lane.addEventListener(
        "dragleave",
        ()=>{

            lane.classList.remove(
                "dragOver"
            );

        }
    );



    lane.addEventListener(
        "drop",
        e=>{


            e.preventDefault();


            lane.classList.remove(
                "dragOver"
            );


            const data =
                e.dataTransfer.getData(
                    "sound"
                );


            if(!data)
                return;



            const sound =
                JSON.parse(
                    data
                );



            const rect =
                lane.getBoundingClientRect();



            const x =
                e.clientX -
                rect.left;



            const seconds =
                Math.max(
                    0,
                    x / 100
                );



            addTimelineBlock(
                sound,
                trackID,
                seconds
            );


        }
    );


}





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



    const duration =
        1;



    block.style.left =
        start *
        100 +
        "px";



    block.style.width =
        duration *
        100 +
        "px";



    const object={


        id:
        Date.now(),


        sound:sound,


        track:
        trackID,


        start:start,


        duration:duration,


        volume:1,


        pitch:"normal",


        element:block


    };



    timelineObjects.push(
        object
    );



    tracks[trackID]
    .lane
    .appendChild(
        block
    );



    block.onclick=
        ()=>{


            openEditor(
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
   BLOCK LÖSCHEN
========================================= */


function deleteBlock(
    object
){


    if(
        !object
    )
        return;



    object.element.remove();



    timelineObjects =
        timelineObjects.filter(
            item=>
            item.id !== object.id
        );



    selectedBlock=null;


    updateSoundCount();


}






/* =========================================
   BLOCK VERSCHIEBEN
========================================= */


function moveBlock(
    object,
    newStart
){


    object.start =
        Math.max(
            0,
            newStart
        );



    object.element.style.left =
        object.start *
        100 +
        "px";


}





/* =========================================
   BLOCK BREITE ÄNDERN
========================================= */


function resizeBlock(
    object
){


    object.element.style.width =
        object.duration *
        100 +
        "px";


}
/* =========================================
   script.js Teil 3/4

   Modal Editor
   Playback
   Playhead
========================================= */


/* =========================================
   MODAL ELEMENTE
========================================= */


const modal =
    document.getElementById(
        "modal"
    );


const editStart =
    document.getElementById(
        "editStart"
    );


const editDuration =
    document.getElementById(
        "editDuration"
    );


const editVolume =
    document.getElementById(
        "editVolume"
    );


const editPitch =
    document.getElementById(
        "editPitch"
    );


const startValue =
    document.getElementById(
        "startValue"
    );


const durationValue =
    document.getElementById(
        "durationValue"
    );


const volumeValue =
    document.getElementById(
        "volumeValue"
    );



/* =========================================
   EDITOR ÖFFNEN
========================================= */


function openEditor(
    object
){


    selectedBlock =
        object;



    modal.classList.remove(
        "hidden"
    );



    editStart.value =
        object.start;



    editDuration.value =
        object.duration;



    editVolume.value =
        object.volume;



    editPitch.value =
        object.pitch;



    updateEditorLabels();



}





function closeEditor(){

    modal.classList.add(
        "hidden"
    );

    selectedBlock=null;

}




/* =========================================
   SLIDER UPDATE
========================================= */


function updateEditorLabels(){


    startValue.textContent =
        Number(
            editStart.value
        ).toFixed(1);



    durationValue.textContent =
        Number(
            editDuration.value
        ).toFixed(1);



    volumeValue.textContent =
        Number(
            editVolume.value
        ).toFixed(2);


}





editStart.oninput=()=>{

    if(!selectedBlock)
        return;


    selectedBlock.start =
        Number(
            editStart.value
        );


    moveBlock(
        selectedBlock,
        selectedBlock.start
    );


    updateEditorLabels();

};



editDuration.oninput=()=>{

    if(!selectedBlock)
        return;


    selectedBlock.duration =
        Number(
            editDuration.value
        );


    resizeBlock(
        selectedBlock
    );


    updateEditorLabels();

};




editVolume.oninput=()=>{

    if(!selectedBlock)
        return;


    selectedBlock.volume =
        Number(
            editVolume.value
        );


    updateEditorLabels();

};



editPitch.onchange=()=>{


    if(!selectedBlock)
        return;


    selectedBlock.pitch =
        editPitch.value;


};





document
.getElementById(
    "closeModal"
)
.onclick =
    closeEditor;





document
.getElementById(
    "deleteBlock"
)
.onclick =
    ()=>{


        deleteBlock(
            selectedBlock
        );


        closeEditor();


    };





/* =========================================
   PLAYBACK
========================================= */


document
.getElementById(
    "playBtn"
)
.onclick =
    startPlayback;



document
.getElementById(
    "stopBtn"
)
.onclick =
    stopPlayback;




function startPlayback(){


    if(isPlaying)
        return;



    isPlaying=true;


    statusText.textContent =
        "Wiedergabe";



    playPosition=0;



    const startTime =
        performance.now();



    playTimer =
        setInterval(
            ()=>{


                const now =
                    performance.now();



                playPosition =
                    (now-startTime)
                    /1000;



                updatePlayhead();



                timelineObjects.forEach(
                    obj=>{


                        if(
                            Math.abs(
                                obj.start -
                                playPosition
                            )
                            <0.03
                        ){

                            playSoundObject(
                                obj.sound
                            );

                        }


                    }
                );



                if(
                    playPosition >=
                    timelineLength
                ){

                    stopPlayback();

                }



            },
            20
        );

}




function updatePlayhead(){


    playhead.style.left =
        120 +
        playPosition *
        100 +
        "px";


}





function stopPlayback(){


    isPlaying=false;


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
   script.js Teil 4/4

   Recorder
   Voice Pool
   Buttons
   Final Setup
========================================= */


/* =========================================
   AUFNAHME BUTTON
========================================= */


const recordBtn =
    document.getElementById(
        "recordBtn"
    );


let recording=false;



recordBtn.onclick=async()=>{


    if(!recording){


        try{


            await startRecording();


            recording=true;


            recordBtn.textContent =
                "⏹ Aufnahme stoppen";


            statusText.textContent =
                "Aufnahme läuft";


        }
        catch(error){


            console.error(error);


            statusText.textContent =
                "Mikrofon Fehler";


        }


    }
    else{


        stopRecording();


        recording=false;


        recordBtn.textContent =
            "🎤 Aufnahme starten";


        statusText.textContent =
            "Aufnahme gespeichert";


    }


};





/* =========================================
   VOICE SOUNDPOOL
========================================= */


function refreshVoiceList(){


    const list =
        document.getElementById(
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


            item.draggable=true;



            item.innerHTML=`

            <div class="soundName">
                ${voice.name}
            </div>


            <div class="soundButtons">

                <button class="previewButton">
                    ▶
                </button>

                <div class="dragHandle">
                    DRAG
                </div>

            </div>

            `;



            item.querySelector(
                ".previewButton"
            )
            .onclick=()=>{


                playVoice(
                    voice
                );


            };



            item.addEventListener(
                "dragstart",
                e=>{


                    e.dataTransfer.setData(
                        "sound",
                        JSON.stringify(
                            voice
                        )
                    );


                }
            );



            list.appendChild(
                item
            );


        }
    );


}





/* =========================================
   SPUR HINZUFÜGEN
========================================= */


document
.getElementById(
    "addTrackBtn"
)
.onclick =
    ()=>{


        addTrack();


    };





/* =========================================
   TIMELINE LEEREN
========================================= */


document
.getElementById(
    "clearBtn"
)
.onclick =
    ()=>{


        timelineObjects.forEach(
            obj=>{

                obj.element.remove();

            }
        );



        timelineObjects=[];


        updateSoundCount();


        statusText.textContent =
            "Timeline geleert";


    };





/* =========================================
   TASTENKÜRZEL
========================================= */


window.addEventListener(
    "keydown",
    e=>{


        if(e.code==="Space"){


            e.preventDefault();



            if(isPlaying)
                stopPlayback();

            else
                startPlayback();


        }



        if(
            e.code==="Escape"
        ){

            closeEditor();

        }


    }
);





/* =========================================
   TIMELINE ZOOM / SCROLL
========================================= */


workspace.addEventListener(
    "wheel",
    e=>{


        if(e.ctrlKey){


            e.preventDefault();



            let scale =
                Number(
                    timelineContainer
                    .dataset.scale ||
                    1
                );



            scale +=
                e.deltaY *
                -0.001;



            scale =
                Math.min(
                    2,
                    Math.max(
                        0.5,
                        scale
                    )
                );



            timelineContainer.style.transform =
                `scaleX(${scale})`;



            timelineContainer.dataset.scale =
                scale;


        }


    },
    {
        passive:false
    }
);





/* =========================================
   START
========================================= */


window.addEventListener(
    "load",
    ()=>{


        createDefaultTracks();


        createTimeScale();


        loadSoundPool();


        statusText.textContent =
            "DAW bereit";


    }
);
