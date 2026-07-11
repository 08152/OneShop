// GhostChat - kleiner WhatsApp-Klon
// Server.js für Render

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


// Dateien aus public laden
app.use(express.static(path.join(__dirname, "public")));


// Test-Seite
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Aktive Nutzer speichern
let users = {};


// Wenn ein Nutzer verbindet
io.on("connection", (socket) => {

    console.log("Neuer Nutzer verbunden:", socket.id);


    // Nutzer anmelden
    socket.on("join", (username) => {

        users[socket.id] = {
            name: username
        };

        console.log(username + " ist online");

        io.emit("users", getUsers());
    });



    // Nachricht senden
    socket.on("message", (data) => {

        const user = users[socket.id];

        if (!user) return;


        const message = {
            username: user.name,
            text: data.text,
            time: new Date().toLocaleTimeString()
        };


        // Nachricht an alle senden
        io.emit("message", message);

    });



    // Nutzer trennt Verbindung
    socket.on("disconnect", () => {

        if(users[socket.id]){

            console.log(
                users[socket.id].name + " ist offline"
            );

            delete users[socket.id];

            io.emit("users", getUsers());

        }

    });

});



// Nutzerliste
function getUsers(){

    return Object.values(users);

}



// Server starten
server.listen(PORT, () => {

    console.log(
        "GhostChat läuft auf Port " + PORT
    );

});
