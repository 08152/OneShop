// ======================================
// pose.js
// Mecha Chameleon Posen
// Three.js Version
// ======================================



let currentPose = "stand";



const poseMenu =
document.getElementById("poseMenu");





// ===============================
// Taste 1
// ===============================


window.addEventListener(
"keydown",
(e)=>{


    if(e.key === "1"){

        poseMenu.classList.toggle(
            "hidden"
        );

    }


});






// ===============================
// Buttons
// ===============================


document
.getElementById("poseStand")
.onclick = ()=>{

    setPose("stand");

};



document
.getElementById("poseLie")
.onclick = ()=>{

    setPose("lie");

};



document
.getElementById("poseHead")
.onclick = ()=>{

    setPose("headstand");

};








// ===============================
// Pose setzen
// ===============================


function setPose(pose){



    currentPose = pose;



    // zurücksetzen

    player.rotation.set(
        0,
        player.rotation.y,
        0
    );



    player.position.y=2;



    body.rotation.set(0,0,0);
    head.rotation.set(0,0,0);

    leftArm.rotation.set(0,0,0);
    rightArm.rotation.set(0,0,0);

    leftLeg.rotation.set(0,0,0);
    rightLeg.rotation.set(0,0,0);






    // =========================
    // Stehen
    // =========================

    if(pose==="stand"){


        player.rotation.z=0;


    }





    // =========================
    // Liegen
    // =========================

    if(pose==="lie"){


        player.rotation.z =
        Math.PI/2;


        player.position.y=1;



        leftArm.rotation.z =
        0.5;


        rightArm.rotation.z =
        -0.5;


    }






    // =========================
    // Kopfstand
    // =========================

    if(pose==="headstand"){


        player.rotation.z =
        Math.PI;



        player.position.y=3;



        leftLeg.rotation.x =
        1;


        rightLeg.rotation.x =
        1;



        leftArm.rotation.x =
        -1;


        rightArm.rotation.x =
        -1;


    }



}








// ===============================
// Animation
// ===============================


function animatePose(){



    if(
        currentPose === "headstand"
    ){


        player.rotation.y +=
        0.01;


    }


}
