const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("."));

let terminal = [];

io.on("connection", socket => {

    socket.emit("history", terminal);

    socket.on("line", line => {

        terminal.push(line);

        if (terminal.length > 1000)
            terminal.shift();

        io.emit("line", line);

    });

    socket.on("clear", () => {

        terminal = [];

        io.emit("clear");

    });

});

server.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
