const express = require("express");
const cors = require("cors");
const fs = require("fs");


const app = express();


app.use(cors());
app.use(express.json());
app.use(express.static("./"));


// KI Daten laden

let aiData = JSON.parse(
    fs.readFileSync("v1.1.json", "utf8")
);



function loadMemory(){

    return JSON.parse(
        fs.readFileSync("memory.json","utf8")
    );

}



function saveMemory(data){

    fs.writeFileSync(
        "memory.json",
        JSON.stringify(data,null,2)
    );

}




app.get("/api/status",(req,res)=>{

    res.json({
        online:true,
        version:"MiniKI v1.1"
    });

});





app.post("/api/chat",(req,res)=>{


    let question =
    req.body.message.toLowerCase();



    let answer =
    "Das weiß ich noch nicht.";



    // Hauptmodell

    for(let item of aiData.knowledge){

        if(question.includes(item.question)){

            answer=item.answer;

        }

    }




    // Speicher durchsuchen

    let memory=loadMemory();


    for(let item of memory.knowledge){

        if(question.includes(item.question)){

            answer=item.answer;

        }

    }





    // Lernen

    if(req.body.learn){


        memory.knowledge.push({

            question:question,
            answer:req.body.learn

        });


        saveMemory(memory);


        answer="Gespeichert. Ich habe das gelernt.";

    }




    res.json({

        ai:"MiniKI v1.1",
        answer:answer

    });


});





app.listen(

process.env.PORT || 3000,

()=>{

console.log("MiniKI läuft");

}

);
