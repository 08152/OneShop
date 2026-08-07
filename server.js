// =====================================
// GPS Navi
// server.js
// Render Server
// =====================================


import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";



const app = express();

const PORT = process.env.PORT || 3000;



// Pfade für ES Module

const __filename =
fileURLToPath(import.meta.url);


const __dirname =
path.dirname(__filename);




// Middleware

app.use(cors());

app.use(express.json());



// Webseite bereitstellen

app.use(

express.static(__dirname)

);




// Startseite

app.get(

"/",

(req,res)=>{

    res.sendFile(

        path.join(

            __dirname,

            "index.html"

        )

    );

}

);




// Gesundheitsprüfung für Render

app.get(

"/health",

(req,res)=>{

    res.json({

        status:"ok",

        app:"GPS Navi"

    });

}

);




// Server starten

app.listen(

PORT,

()=>{

    console.log(

        "GPS Navi läuft auf Port "

        +

        PORT

    );

}

);
