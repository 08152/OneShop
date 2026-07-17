const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));


let wissen = JSON.parse(
    fs.readFileSync("1.json","utf8")
);


let memory = JSON.parse(
    fs.readFileSync("memory.json","utf8")
);



app.get("/api/data",(req,res)=>{

    res.json({
        knowledge: wissen.knowledge,
        memory: memory.learned
    });

});



// Velo lernt neue Antworten

app.post("/api/learn",(req,res)=>{

    let daten=req.body;


    if(daten.question && daten.answer){

        memory.learned.push({

            question:daten.question,

            answer:daten.answer

        });


        fs.writeFileSync(
            "memory.json",
            JSON.stringify(memory,null,2)
        );


        res.json({
            success:true,
            message:"Velo hat gelernt."
        });

    }

    else{

        res.json({
            success:false
        });

    }

});



app.listen(3000,()=>{

console.log("Velo läuft auf Port 3000");

});
