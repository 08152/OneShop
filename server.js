const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();


app.use(cors());
app.use(express.json());

app.use(express.static("public"));



// =====================
// UPLOAD 150 MB
// =====================

const upload = multer({

    limits:{
        fileSize:150 * 1024 * 1024
    }

});




// =====================
// MALWARE DATENBANK LADEN
// =====================

let malwareDB = [];


try{

const json =
fs.readFileSync(
"1.json",
"utf8"
);


malwareDB =
JSON.parse(json).signatures;


console.log(
"Malware Datenbank geladen:",
malwareDB.length,
"Signaturen"
);


}

catch(e){

console.log(
"Keine Datenbank gefunden"
);

}




// =====================
// SCANNER
// =====================


app.post(
"/api/scan",
upload.single("file"),
(req,res)=>{


if(!req.file){

return res.json({

success:false,

error:"Keine Datei"

});

}



let content =
req.file.buffer
.toString("utf8")
.toLowerCase();



let findings=[];



// Datenbank durchsuchen

malwareDB.forEach(signature=>{


if(
content.includes(
signature.pattern.toLowerCase()
)

){

findings.push({

name:signature.name,

risk:signature.risk,

description:
signature.description

});


}


});





res.json({

success:true,


verdict:
findings.length > 0
?
"GEFÄHRLICH"
:
"SAUBER",


findings:findings


});



});





// =====================
// FEHLER
// =====================


app.use((err,req,res,next)=>{


if(err.code==="LIMIT_FILE_SIZE"){


return res.status(413).json({

success:false,

error:
"Maximale Größe 150 MB"

});


}


next(err);


});





const PORT =
process.env.PORT || 3000;


app.listen(PORT,()=>{


console.log(
`Scanner läuft auf Port ${PORT}`
);


});
