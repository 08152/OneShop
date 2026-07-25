const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();


// =========================
// UPLOAD 150 MB
// =========================

const upload = multer({

    limits:{
        fileSize:150 * 1024 * 1024
    }

});


app.use(cors());
app.use(express.json());



// =========================
// NORTON STYLE WEBSITE
// =========================

app.get("/",(req,res)=>{


res.send(`

<!DOCTYPE html>
<html lang="de">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">


<title>Norton Style Scanner</title>


<style>

body{

background:#111;
color:white;
font-family:Arial;
display:flex;
justify-content:center;
padding:40px;

}


.box{

width:750px;
background:#222;
border-radius:15px;
padding:30px;
box-shadow:0 0 30px black;
text-align:center;

}


.logo{

font-size:30px;
font-weight:bold;
color:#ffcc00;

}



.circle{

width:170px;
height:170px;

border-radius:50%;

border:8px solid #ffcc00;

margin:30px auto;

display:flex;
align-items:center;
justify-content:center;
flex-direction:column;

}



.safe{

border-color:#2ecc71;

}



.danger{

border-color:#e74c3c;

}



.drop{

padding:50px;

background:#181818;

border:2px dashed #555;

border-radius:10px;

}



button{

background:#ffcc00;

padding:12px 30px;

border:0;

border-radius:5px;

font-weight:bold;

cursor:pointer;

}



#result{

margin-top:25px;

}



li{

text-align:left;

}


</style>


</head>



<body>


<div class="box">


<div class="logo">
✓ Norton Style Scanner
</div>



<div id="circle" class="circle">

Status

<b id="status">
BEREIT
</b>

</div>



<div class="drop">


<input id="file" type="file">


<br><br>


<button onclick="scan()">
Datei prüfen
</button>


</div>



<div id="result"></div>


</div>




<script>


let file;



document
.getElementById("file")
.onchange=function(e){

file=e.target.files[0];

};



async function scan(){


if(!file){

alert("Keine Datei ausgewählt");

return;

}



let form=new FormData();

form.append("file",file);



document.getElementById("status").innerHTML="PRÜFE...";



let response=await fetch("/api/scan",{

method:"POST",

body:form

});



let data=await response.json();



let circle=document.getElementById("circle");

let status=document.getElementById("status");

let result=document.getElementById("result");



if(data.verdict==="GEFÄHRLICH"){


circle.className="circle danger";

status.innerHTML="GEFAHR";


result.innerHTML=

"<h3>Gefunden:</h3><ul>"+

data.findings
.map(x=>"<li>"+x+"</li>")
.join("")

+"</ul>";



}

else{


circle.className="circle safe";

status.innerHTML="SICHER";


result.innerHTML=
"Keine verdächtigen Muster gefunden.";


}


}



</script>



</body>

</html>


`);


});




// =========================
// SCAN API
// =========================


app.post("/api/scan",
upload.single("file"),
(req,res)=>{


if(!req.file){

return res.json({

success:false,

error:"Keine Datei"

});

}



let content=req.file.buffer.toString("utf8");

let findings=[];



const rules=[


{
pattern:/eval\s*\(/i,
desc:"eval() Code-Ausführung erkannt"
},


{
pattern:/document\.write\s*\(/i,
desc:"DOM Manipulation erkannt"
},


{
pattern:/<script[^>]*src=["']http:/i,
desc:"Unsicheres HTTP Script"
},


{
pattern:/crypto-miner|coinhive|monero/i,
desc:"Crypto Mining Muster erkannt"
},


{
pattern:/atob\s*\(/i,
desc:"Base64 Verschleierung erkannt"
},


{
pattern:/String\.fromCharCode/i,
desc:"Verdächtige Code-Erzeugung"
},


{
pattern:/window\.location|location\.replace/i,
desc:"Automatische Weiterleitung"
}


];




rules.forEach(rule=>{


if(rule.pattern.test(content)){

findings.push(rule.desc);

}


});





res.json({

success:true,

verdict:
findings.length
?
"GEFÄHRLICH"
:
"SAUBER",

findings:findings


});



});





// =========================
// FEHLERHANDLER
// =========================


app.use((err,req,res,next)=>{


if(err.code==="LIMIT_FILE_SIZE"){


return res.status(413).json({

success:false,

error:"Datei zu groß. Maximum: 150 MB"

});


}


next(err);


});





// =========================
// SERVER START
// =========================


const PORT=process.env.PORT || 3000;


app.listen(PORT,()=>{


console.log(
`Norton Scanner läuft auf Port ${PORT}`
);


});
