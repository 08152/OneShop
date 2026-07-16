const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./"));


let model = JSON.parse(
    fs.readFileSync(
        path.join(__dirname,"v1.1.json"),
        "utf8"
    )
);


function loadMemory(){

    return JSON.parse(
        fs.readFileSync(
            path.join(__dirname,"memory.json"),
            "utf8"
        )
    );

}



function saveMemory(data){

    fs.writeFileSync(
        path.join(__dirname,"memory.json"),
        JSON.stringify(data,null,2)
    );

}



app.post("/api/chat",(req,res)=>{


    let question =
    req.body.message.toLowerCase();


    let memory = loadMemory();


    let answer = null;



    // Hauptwissen durchsuchen

    for(let item of model.knowledge){

        if(question.includes(item.question)){

            answer=item.answer;
            break;

        }

    }



    // Lernspeicher durchsuchen

    for(let item of memory.knowledge){

        if(question.includes(item.question)){

            answer=item.answer;
            break;

        }

    }



    // Nicht gefunden

    if(!answer){

        answer=
        "Das weiß ich nicht. Schreibe mir die richtige Antwort mit /lernen.";

    }



    res.json({

        answer:answer

    });



});





// Lernen

app.post("/api/learn",(req,res)=>{


    let memory = loadMemory();


    memory.knowledge.push({

        question:req.body.question.toLowerCase(),

        answer:req.body.answer

    });



    saveMemory(memory);



    res.json({

        status:"gelernt",

        data:req.body

    });



});





app.listen(

process.env.PORT || 3000,

()=>console.log("MiniKI Lernserver läuft")

);
