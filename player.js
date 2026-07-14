// ======================================
// player.js
// Teil 1/3
// Mecha Chameleon
// Three.js Version
// ======================================


// Szene

const scene = new THREE.Scene();

scene.background =
new THREE.Color(0x87ceeb);



// Kamera

const camera =
new THREE.PerspectiveCamera(

    75,

    window.innerWidth /
    window.innerHeight,

    0.1,

    1000

);




// Renderer

const renderer =
new THREE.WebGLRenderer({

    antialias:true

});


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.shadowMap.enabled = true;


document
.getElementById("game")
.appendChild(
    renderer.domElement
);





// ======================================
// Licht
// ======================================


const light =
new THREE.DirectionalLight(
    0xffffff,
    2
);


light.position.set(
    10,
    20,
    10
);


light.castShadow=true;


scene.add(light);



scene.add(
new THREE.AmbientLight(
    0xffffff,
    0.5
));






// ======================================
// Boden
// ======================================


const ground =
new THREE.Mesh(

    new THREE.PlaneGeometry(
        500,
        500
    ),

    new THREE.MeshStandardMaterial({

        color:0x3aa83a

    })

);



ground.rotation.x =
-Math.PI/2;


ground.receiveShadow=true;


scene.add(ground);






// ======================================
// Spieler Gruppe
// ======================================


const player =
new THREE.Group();


scene.add(player);





// Material

const mechaMaterial =
new THREE.MeshStandardMaterial({

    color:0x999999,

    metalness:0.8,

    roughness:0.3

});





// ======================================
// Körper
// ======================================


const body =
new THREE.Mesh(

    new THREE.BoxGeometry(
        1,
        1.6,
        0.6
    ),

    mechaMaterial

);


body.castShadow=true;


player.add(body);





// ======================================
// Kopf
// ======================================


const head =
new THREE.Mesh(

    new THREE.BoxGeometry(
        0.7,
        0.7,
        0.7
    ),

    mechaMaterial

);


head.position.y=1.15;


head.castShadow=true;


player.add(head);





// ======================================
// Arme
// ======================================


const leftArm =
new THREE.Mesh(

    new THREE.BoxGeometry(
        0.25,
        1,
        0.25
    ),

    mechaMaterial

);


leftArm.position.set(
    -0.7,
    0.2,
    0
);


player.add(leftArm);



const rightArm =
leftArm.clone();


rightArm.position.x=0.7;


player.add(rightArm);





// ======================================
// Beine
// ======================================


const leftLeg =
new THREE.Mesh(

    new THREE.BoxGeometry(
        0.3,
        1.2,
        0.3
    ),

    mechaMaterial

);


leftLeg.position.set(
    -0.22,
    -1.4,
    0
);


player.add(leftLeg);




const rightLeg =
leftLeg.clone();


rightLeg.position.x=0.22;


player.add(rightLeg);





// Startposition

player.position.y=2;
// ======================================
// player.js
// Teil 2/3
// Bewegung & Animation
// Three.js Version
// ======================================


// Tastatur

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




// Bewegung

let walkSpeed = 0.08;
let runSpeed = 0.15;



// Physik

let velocityY = 0;

let gravity = -0.02;

let jumpPower = 0.35;

let grounded = false;



// Animation

let walkTime = 0;




function updatePlayer(){


    let speed =
    keys["shift"]
    ?
    runSpeed
    :
    walkSpeed;



    let moving=false;




    // Vorwärts

    if(keys["w"]){

        player.position.z -= speed;

        moving=true;

    }



    // Rückwärts

    if(keys["s"]){

        player.position.z += speed;

        moving=true;

    }



    // Links

    if(keys["a"]){

        player.position.x -= speed;

        moving=true;

    }



    // Rechts

    if(keys["d"]){

        player.position.x += speed;

        moving=true;

    }





    // Springen

    if(
        keys[" "] &&
        grounded
    ){

        velocityY =
        jumpPower;


        grounded=false;

    }





    // Schwerkraft

    velocityY += gravity;


    player.position.y += velocityY;





    // Boden

    if(
        player.position.y <= 2
    ){

        player.position.y=2;

        velocityY=0;

        grounded=true;

    }





    // Laufanimation

    if(moving){


        walkTime +=0.18;



        leftArm.rotation.x =
        Math.sin(walkTime)
        *0.8;



        rightArm.rotation.x =
        -Math.sin(walkTime)
        *0.8;




        leftLeg.rotation.x =
        -Math.sin(walkTime)
        *0.8;



        rightLeg.rotation.x =
        Math.sin(walkTime)
        *0.8;



    }
    else{


        leftArm.rotation.x=0;

        rightArm.rotation.x=0;

        leftLeg.rotation.x=0;

        rightLeg.rotation.x=0;


    }


}
// ======================================
// player.js
// Teil 3/3
// Game Loop
// Three.js Version
// ======================================



// Fenstergröße

window.addEventListener(
"resize",
()=>{


    camera.aspect =
    window.innerWidth /
    window.innerHeight;


    camera.updateProjectionMatrix();



    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


});






// ======================================
// Haupt Loop
// ======================================


function animate(){


    requestAnimationFrame(
        animate
    );



    // Spieler bewegen

    updatePlayer();




    // Kamera aus camera.js

    if(typeof updateCamera === "function"){

        updateCamera();

    }





    // Posen aus pose.js

    if(typeof animatePose === "function"){

        animatePose();

    }






    // Szene rendern

    renderer.render(
        scene,
        camera
    );


}






// Start

animate();
