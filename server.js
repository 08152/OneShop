const express = require("express");

const app = express();

app.use(express.json());

let wissen = require("./wissen.json");


app.post("/frage",(req,res)=>{

let frage=req.body.frage.toLowerCase();

let antwort="Keine Antwort gefunden";


for(let eintrag of wissen){

if(frage.includes(eintrag.frage)){
antwort=eintrag.antwort;
break;
}

}


res.json({
antwort:antwort
});

});


app.listen(3000,()=>{
console.log("KI Server läuft");
});
