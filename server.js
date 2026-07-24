/*
====================================
 NortonMarket Server
 Express + JSON Datenbank
====================================
*/


const express = require("express");

const cors = require("cors");

const fs = require("fs");

const path = require("path");



const app = express();


const PORT =
process.env.PORT || 3000;



/* ================================
   Middleware
================================ */


app.use(
cors()
);


app.use(
express.json(
{
    limit:"100mb"
}
));


app.use(
express.static(
__dirname
)
);



/* ================================
   Datenbank
================================ */


const databaseFile =
path.join(
__dirname,
"database.json"
);



function loadDatabase(){


if(
!fs.existsSync(databaseFile)
){


fs.writeFileSync(

databaseFile,

JSON.stringify(

{

users:[],

items:[]

},

null,

2

)

);


}



return JSON.parse(

fs.readFileSync(
databaseFile,
"utf8"
)

);


}



function saveDatabase(
data
){


fs.writeFileSync(

databaseFile,

JSON.stringify(

data,

null,

2

)

);


}
/* ================================
   Benutzer API
================================ */


/*
   Alle Benutzer abrufen
*/

app.get(
"/api/users",
(req,res)=>{


    const db =
    loadDatabase();


    res.json(
        db.users
    );


});



/*
   Benutzer hinzufügen
*/

app.post(
"/api/users",
(req,res)=>{


    const user =
    req.body;



    if(
        !user.email ||
        !user.pin
    ){

        return res.status(400)
        .json({

            error:
            "E-Mail und PIN fehlen"

        });

    }



    const db =
    loadDatabase();



    const exists =
    db.users.find(

        u =>
        u.email === user.email

    );



    if(!exists){


        db.users.push({

            email:user.email,

            pin:user.pin,

            created:
            user.created ||
            new Date()
            .toISOString()

        });


        saveDatabase(
            db
        );


    }



    res.json({

        success:true

    });


});



/*
   Benutzer Login prüfen
*/

app.post(
"/api/login",
(req,res)=>{


    const {

        email,

        pin

    } = req.body;



    const db =
    loadDatabase();



    const user =
    db.users.find(

        u =>
        u.email === email
        &&
        u.pin === pin

    );



    if(user){


        res.json(
            user
        );


    }
    else{


        res.status(401)
        .json({

            error:
            "Falsche Daten"

        });


    }


});
/* ================================
   Artikel API
================================ */


/*
   Alle Artikel abrufen
*/

app.get(
"/api/items",
(req,res)=>{


    const db =
    loadDatabase();



    res.json(
        db.items
    );


});



/*
   Artikel speichern
*/

app.post(
"/api/items",
(req,res)=>{


    const newItems =
    req.body;



    if(
        !Array.isArray(newItems)
    ){

        return res.status(400)
        .json({

            error:
            "Ungültige Artikeldaten"

        });

    }



    const db =
    loadDatabase();



    db.items =
    newItems;



    saveDatabase(
        db
    );



    res.json({

        success:true,

        count:
        db.items.length

    });


});



/*
   Einzelnen Artikel abrufen
*/

app.get(
"/api/items/:id",
(req,res)=>{


    const db =
    loadDatabase();



    const item =
    db.items.find(

        i =>
        i.id ==
        req.params.id

    );



    if(!item){


        return res.status(404)
        .json({

            error:
            "Artikel nicht gefunden"

        });


    }



    res.json(
        item
    );


});



/*
   Artikel löschen
*/

app.delete(
"/api/items/:id",
(req,res)=>{


    const db =
    loadDatabase();



    db.items =
    db.items.filter(

        i =>
        i.id !=
        req.params.id

    );



    saveDatabase(
        db
    );



    res.json({

        success:true

    });


});
/* ================================
   Server Dateien
================================ */


/*
   index.html ausliefern
*/

app.get(
"/",
(req,res)=>{


    res.sendFile(

        path.join(
            __dirname,
            "index.html"
        )

    );


});



/* ================================
   Fehlerbehandlung
================================ */


app.use(
(err,req,res,next)=>{


    console.error(
        err
    );


    res.status(500)
    .json({

        error:
        "Interner Serverfehler"

    });


});



/* ================================
   Datenbank beim Start prüfen
================================ */


loadDatabase();



console.log(
"📦 Datenbank geladen"
);



/* ================================
   Server starten
================================ */


app.listen(
PORT,
()=>{


console.log(
`🚀 NortonMarket Server läuft auf Port ${PORT}`
);


});
/* ================================
   Automatische Sicherung
================================ */


function backupDatabase(){


    const db =
    loadDatabase();



    const backupFile =
    path.join(

        __dirname,

        "database_backup.json"

    );



    fs.writeFileSync(

        backupFile,

        JSON.stringify(

            db,

            null,

            2

        )

    );


}



/* Alle 5 Minuten Backup */

setInterval(

()=>{


    backupDatabase();



},

300000

);



/* ================================
   Server Status
================================ */


app.get(
"/api/status",
(req,res)=>{


    res.json({

        online:true,

        name:
        "NortonMarket",

        time:
        new Date()
        .toISOString()

    });


});



/* ================================
   Ende server.js
================================ */
