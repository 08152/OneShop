const express = require("express");
const path = require("path");

const app = express();

const PORT =
    process.env.PORT || 3000;


/*
    Alle Dateien befinden sich
    im selben Ordner:

    index.html
    server.js
    package.json
*/

app.use(
    express.static(__dirname)
);


/*
    index.html ausliefern
*/

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/*
    Fallback für Express 5.
    NICHT app.get("*") benutzen.
*/

app.use((req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


app.listen(
    PORT,
    () => {

        console.log(
            `GHOST Finance läuft auf Port ${PORT}`
        );

    }
);
