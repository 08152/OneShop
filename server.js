const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const history = [];

app.use(express.static(__dirname));

io.on("connection", (socket) => {
    socket.emit("history", history);

    socket.on("line", (text) => {
        if (typeof text !== "string") return;

        text = text.trim();
        if (!text) return;

        history.push(text);

        if (history.length > 500) {
            history.shift();
        }

        io.emit("line", text);
    });
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
