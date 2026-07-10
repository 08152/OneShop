const express = require("express");
const cors = require("cors");

const app = express();


// Erlaubt Anfragen von deiner HTML-Datei
app.use(cors());


// JSON erlauben
app.use(express.json());


// Startseite
app.get("/", (req, res) => {
    res.send("🤖 Code KI Server läuft!");
});


// Wissensdaten
let wissen = [
    {
        frage: "button",
        antwort: `<button>Klick mich</button>

<style>
button{
padding:15px;
background:blue;
color:white;
border:none;
border-radius:10px;
}
</style>`
    },

    {
        frage: "html seite",
        antwort: `<!DOCTYPE html>
<html>
<body>

<h1>Meine Seite</h1>

</body>
</html>`
    },

    {
        frage: "spiel",
        antwort: `<canvas id="game"></canvas>

<script>
let canvas=document.getElementById("game");
let ctx=canvas.getContext("2d");

ctx.fillStyle="green";
ctx.fillRect(50,50,100,100);
<\/script>`
    },

    {
        frage: "rechnung",
        antwort: `<script>
let a=10;
let b=5;

console.log(a+b);
<\/script>`
    }
];


// KI Anfrage
app.post("/frage", (req,res)=>{


let frage = req.body.frage;


if(!frage){

return res.json({
antwort:"Keine Frage erhalten."
});

}


frage = frage.toLowerCase();


let beste = null;


// Suche nach passender Antwort

for(let eintrag of wissen){

if(frage.includes(eintrag.frage)){

beste = eintrag.antwort;
break;

}

}


// Wenn nichts gefunden

if(!beste){

beste = 
`<!-- KI Vorschlag -->

<!DOCTYPE html>
<html>

<head>

<style>

body{
font-family:Arial;
}

</style>

</head>


<body>

<h1>Neues Projekt</h1>


</body>

</html>`;

}


// Antwort senden

res.json({

antwort:beste

});


});



// Render Port

const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{

console.log(
"KI Server läuft auf Port " + PORT
);

});
