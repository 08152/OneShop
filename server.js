// GhostChat - kleiner WhatsApp Klon
// Render kompatibel

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = process.env.PORT || 3000;


// HTML Dateien aus dem Hauptordner laden
app.use(express.static(__dirname));


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// Nutzer speichern
let users = {};


// Verbindung
io.on("connection", (socket) => {

    console.log("Nutzer verbunden:", socket.id);


    // Login
    socket.on("join", (username) => {

        users[socket.id] = {
            name: username
        };

        io.emit("users", Object.values(users));

        console.log(username + " ist online");

    });



    // Nachricht
    socket.on("message", (text) => {

        if (!users[socket.id]) return;


        const msg = {

            user: users[socket.id].name,

            text: text,

            time: new Date()
                .toLocaleTimeString("de-DE",
                {
                    hour:"2-digit",
                    minute:"2-digit"
                })

        };


        io.emit("message", msg);

    });



    // Verbindung beendet
    socket.on("disconnect", () => {


        if(users[socket.id]){

            console.log(
                users[socket.id].name +
                " offline"
            );


            delete users[socket.id];


            io.emit(
                "users",
                Object.values(users)
            );

        }

    });


});



// Server starten
server.listen(PORT, () => {

    console.log(
        "GhostChat läuft auf Port " + PORT
    );

});
