const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'] // Erlaubt Fallback, falls WebSockets blockiert werden
});
const path = require('path');

// Wichtig für Render: Schützt die Ordnerstruktur
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Ein Spieler hat sich verbunden: ' + socket.id);
    
    socket.on('disconnect', () => {
        console.log('Spieler getrennt: ' + socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
