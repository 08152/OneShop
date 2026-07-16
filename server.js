const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./"));

let model = JSON.parse(
    fs.readFileSync("v1.1.json", "utf8")
);


app.post("/api/chat", (req,res)=>{

    let input = req.body.message
        .toLowerCase();

    let answer =
    "Ich kenne diese Information noch nicht.";

    for(let item of model.knowledge){

        if(input.includes(item.question)){
            answer=item.answer;
            break;
        }

    }


    res.json({
        ai:"MiniKI v1.1",
        answer:answer
    });

});


app.listen(3000,()=>{
    console.log("MiniKI läuft auf Port 3000");
});
