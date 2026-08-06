const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('Ein Spieler hat sich verbunden: ' + socket.id);
    
    socket.on('disconnect', () => {
        console.log('Spieler getrennt: ' + socket.id);
    });
});

// Wichtig für Render: Nutzt den dynamischen Port oder 3000 als Fallback
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
