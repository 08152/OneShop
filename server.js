const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "https://onrender.com",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'entries.json');

app.use(express.json());
app.use(express.static(__dirname));

function readLogs() {
    try {
        if (!fs.existsSync(FILE_PATH)) return [];
        const data = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (e) {
        return [];
    }
}

app.post('/api/logs/sync', (req, res) => {
    const { entries } = req.body;
    if (!Array.isArray(entries)) return res.status(400).send("Ungültiges Datenformat.");

    let currentLogs = readLogs();
    currentLogs = [...entries, ...currentLogs];

    fs.writeFileSync(FILE_PATH, JSON.stringify(currentLogs, null, 4), 'utf8');
    
    io.emit('update_logs', currentLogs);
    res.status(200).json({ success: true });
});

io.on('connection', (socket) => {
    socket.emit('update_logs', readLogs());

    socket.on('typing', (data) => {
        socket.broadcast.emit('live_type', data);
    });
});

server.listen(PORT, () => {
    console.log(`Server läuft stabil auf Port ${PORT}`);
});
