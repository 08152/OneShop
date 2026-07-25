const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();


// =====================
// EINSTELLUNGEN
// =====================

app.use(cors());
app.use(express.json());


// =====================
// INDEX.HTML LADEN
// =====================

app.get("/", (req,res)=>{

    res.sendFile(
        __dirname + "/index.html"
    );

});


// =====================
// 1.JSON DATENBANK
// =====================

let malwareDB = [];


function loadDatabase(){

    try{

        const json =
        fs.readFileSync(
            __dirname + "/1.json",
            "utf8"
        );


        malwareDB =
        JSON.parse(json).signatures || [];


        console.log(
            "Malware Datenbank geladen:",
            malwareDB.length,
            "Signaturen"
        );


    }

    catch(error){

        console.log(
            "Fehler: 1.json konnte nicht geladen werden"
        );

        malwareDB=[];

    }

}


loadDatabase();



// Datenbank anzeigen
app.get("/database",(req,res)=>{

    res.json({

        count:malwareDB.length,

        signatures:malwareDB

    });

});



// Datenbank neu laden
app.get("/update",(req,res)=>{

    loadDatabase();

    res.json({

        success:true,

        message:"Datenbank aktualisiert"

    });

});




// =====================
// UPLOAD 150 MB
// =====================


const upload = multer({

    limits:{

        fileSize:
        150 * 1024 * 1024

    }

});




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

            error:
            "Keine Datei übertragen"

        });

    }



    let content;


    try{

        content =
        req.file.buffer
        .toString("utf8")
        .toLowerCase();


    }

    catch(e){

        return res.json({

            success:false,

            error:
            "Datei konnte nicht gelesen werden"

        });

    }



    let findings=[];



    malwareDB.forEach(signature=>{


        if(

            content.includes(
                signature.pattern
                .toLowerCase()
            )

        ){


            findings.push({

                name:
                signature.name,


                risk:
                signature.risk,


                description:
                signature.description

            });


        }


    });





    res.json({

        success:true,


        filename:
        req.file.originalname,


        size:
        req.file.size,


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
// FEHLERBEHANDLUNG
// =====================


app.use((err,req,res,next)=>{


    if(
        err.code === "LIMIT_FILE_SIZE"
    ){

        return res.status(413).json({

            success:false,

            error:
            "Datei zu groß. Maximum 150 MB"

        });

    }



    console.error(err);


    res.status(500).json({

        success:false,

        error:
        "Serverfehler"

    });


});






// =====================
// SERVER START
// =====================


const PORT =
process.env.PORT || 3000;



app.listen(PORT,()=>{


console.log(
`✓ Norton Scanner Server läuft auf Port ${PORT}`
);


});
