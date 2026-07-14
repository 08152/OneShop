// ==================================
// player.js
// Teil 1/3
// Mecha Chameleon
// OHNE THREE.JS
// ==================================


// Canvas

const canvas = document.createElement("canvas");

canvas.id = "canvas3D";

document
.getElementById("game")
.appendChild(canvas);


const gl = canvas.getContext("webgl");



canvas.width = innerWidth;
canvas.height = innerHeight;




// ================================
// Kamera
// ================================

const camera = {

    x:0,
    y:2,
    z:-6,

    rotY:0,
    rotX:0

};




// ================================
// Spieler
// ================================

const player = {

    x:0,
    y:0,
    z:0,

    rot:0,

    parts:[]

};




// Farben

const metal = [
    0.5,
    0.6,
    0.7,
    1
];




// ================================
// 3D Würfel erstellen
// ================================

function createCube(
x,
y,
z,
sx,
sy,
sz,
color
){

    return {

        x,
        y,
        z,

        sx,
        sy,
        sz,

        color

    };

}




// ================================
// Mecha Körper
// ================================


// Körper

const body =
createCube(
0,
0,
0,
1,
1.6,
0.6,
metal
);


// Kopf

const head =
createCube(
0,
1.2,
0,
0.7,
0.7,
0.7,
metal
);



// Arme

const leftArm =
createCube(
-0.7,
0.2,
0,
0.25,
1,
0.25,
metal
);


const rightArm =
createCube(
0.7,
0.2,
0,
0.25,
1,
0.25,
metal
);



// Beine

const leftLeg =
createCube(
-0.22,
-1.3,
0,
0.3,
1.2,
0.3,
metal
);


const rightLeg =
createCube(
0.22,
-1.3,
0,
0.3,
1.2,
0.3,
metal
);




// hinzufügen

player.parts.push(

body,
head,

leftArm,
rightArm,

leftLeg,
rightLeg

);





// ================================
// Resize
// ================================


window.addEventListener(
"resize",
()=>{

canvas.width=innerWidth;
canvas.height=innerHeight;

});





// ================================
// Start
// ================================


console.log(
"Mecha Chameleon 3D Engine gestartet"
);
// ==================================
// player.js
// Teil 2/3
// Eigener 3D Renderer
// OHNE THREE.JS
// ==================================



const ctx = canvas.getContext("2d");




// einfache 3D Projektion

function project(point){


    let x = point.x - camera.x;
    let y = point.y - camera.y;
    let z = point.z - camera.z;



    // Kamera Drehung Y

    let cosY =
    Math.cos(camera.rotY);

    let sinY =
    Math.sin(camera.rotY);


    let dx =
    x * cosY -
    z * sinY;


    let dz =
    x * sinY +
    z * cosY;



    // Kamera Drehung X

    let cosX =
    Math.cos(camera.rotX);

    let sinX =
    Math.sin(camera.rotX);


    let dy =
    y * cosX -
    dz * sinX;


    dz =
    y * sinX +
    dz * cosX;



    if(dz <= 0.1)
        return null;



    let scale =
    400 / dz;



    return {

        x:
        canvas.width/2 +
        dx * scale,


        y:
        canvas.height/2 -
        dy * scale,


        depth:dz

    };

}




// Würfel Ecken

function cubeVertices(c){


    let x=c.x;
    let y=c.y;
    let z=c.z;


    let sx=c.sx/2;
    let sy=c.sy/2;
    let sz=c.sz/2;



    return [

        {x:x-sx,y:y-sy,z:z-sz},
        {x:x+sx,y:y-sy,z:z-sz},
        {x:x+sx,y:y+sy,z:z-sz},
        {x:x-sx,y:y+sy,z:z-sz},


        {x:x-sx,y:y-sy,z:z+sz},
        {x:x+sx,y:y-sy,z:z+sz},
        {x:x+sx,y:y+sy,z:z+sz},
        {x:x-sx,y:y+sy,z:z+sz}

    ];

}




// Würfel zeichnen

function drawCube(c){


    let v =
    cubeVertices(c);


    let p =
    v.map(project);



    if(p.includes(null))
        return;



    const faces=[

        [0,1,2,3],
        [4,5,6,7],
        [0,1,5,4],
        [2,3,7,6],
        [1,2,6,5],
        [0,3,7,4]

    ];



    faces.forEach(face=>{


        ctx.beginPath();


        face.forEach((i,index)=>{

            if(index===0)
                ctx.moveTo(
                    p[i].x,
                    p[i].y
                );
            else
                ctx.lineTo(
                    p[i].x,
                    p[i].y
                );

        });


        ctx.closePath();


        ctx.fillStyle =
        `rgba(
        ${c.color[0]*255},
        ${c.color[1]*255},
        ${c.color[2]*255},
        1)`;


        ctx.fill();


    });


}






// Boden

const floor=[];


for(let x=-10;x<10;x++){

    for(let z=-10;z<10;z++){

        floor.push({

            x:x,
            y:-2,
            z:z,
            sx:1,
            sy:0.1,
            sz:1,

            color:[
                0.2,
                0.7,
                0.2,
                1
            ]

        });

    }

}





// Render Funktion

function render(){


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );



    // Boden

    floor.forEach(drawCube);



    // Spieler

    player.parts.forEach(drawCube);



    requestAnimationFrame(
        render
    );

}


render();
// ==================================
// player.js
// Teil 3/3
// Steuerung & Game Loop
// OHNE THREE.JS
// ==================================



// ================================
// Tastatur
// ================================

const keys = {};


window.addEventListener(
"keydown",
(e)=>{

    keys[e.key.toLowerCase()] = true;

});


window.addEventListener(
"keyup",
(e)=>{

    keys[e.key.toLowerCase()] = false;

});




// ================================
// Bewegung
// ================================

let speed = 0.08;

let velocityY = 0;

let gravity = -0.02;

let jump = 0.35;

let grounded = false;



function updatePlayer(){


    let moving=false;



    if(keys["w"]){

        player.z += Math.cos(camera.rotY) * speed;
        player.x += Math.sin(camera.rotY) * speed;

        moving=true;

    }



    if(keys["s"]){

        player.z -= Math.cos(camera.rotY) * speed;
        player.x -= Math.sin(camera.rotY) * speed;

        moving=true;

    }



    if(keys["a"]){

        player.x -= Math.cos(camera.rotY) * speed;

        moving=true;

    }



    if(keys["d"]){

        player.x += Math.cos(camera.rotY) * speed;

        moving=true;

    }





    // Springen

    if(
        keys[" "] &&
        grounded
    ){

        velocityY=jump;

        grounded=false;

    }



    velocityY += gravity;


    player.y += velocityY;



    if(player.y<=0){

        player.y=0;

        velocityY=0;

        grounded=true;

    }



    // Körper mit Spieler bewegen

    player.parts.forEach(
    p=>{

        p.x =
        p.startX ?? p.x;

    });


}





// ================================
// Maus Kamera
// ================================


let mouseLock=false;


canvas.addEventListener(
"click",
()=>{

    canvas.requestPointerLock();

});



document.addEventListener(
"mousemove",
(e)=>{


    if(
        document.pointerLockElement
        !== canvas
    )
    return;



    camera.rotY -=
    e.movementX*0.002;


    camera.rotX -=
    e.movementY*0.002;



    camera.rotX =
    Math.max(
        -1,
        Math.min(
            1,
            camera.rotX
        )
    );


});






// ================================
// Kamera Update Verbindung
// ================================


function updateCamera(){


    camera.x =
    player.x -
    Math.sin(camera.rotY)*6;


    camera.y =
    player.y + 3;


    camera.z =
    player.z -
    Math.cos(camera.rotY)*6;


}





// ================================
// Pose Verbindung
// ================================


function animatePose(){

    // wird von pose.js benutzt

}





// ================================
// Haupt Loop
// ================================


function gameLoop(){


    updatePlayer();



    if(typeof updateCamera === "function") {

        updateCamera();

    }



    if(typeof animatePose === "function"){

        animatePose();

    }



    // Teile an Spielerposition anpassen

    player.parts.forEach(
    part=>{

        if(!part.offset)
            return;


        part.x =
        player.x +
        part.offset.x;


        part.y =
        player.y +
        part.offset.y;


        part.z =
        player.z +
        part.offset.z;


    });



    requestAnimationFrame(
        gameLoop
    );

}



gameLoop();
