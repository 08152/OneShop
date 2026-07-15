const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: 'https://onrender.com',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(__dirname));

const io = new Server(server, {
  cors: corsOptions
});

const FILE_PATH = path.join(__dirname, 'entries.json');

function readEntries() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading entries file:', err);
    return [];
  }
}

function writeEntries(entries) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing entries file:', err);
  }
}

io.on('connection', (socket) => {
  socket.emit('init', readEntries());

  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data);
  });

  socket.on('new_entry', (entryData) => {
    const entries = readEntries();
    const newEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      text: entryData.text
    };
    entries.push(newEntry);
    writeEntries(entries);
    io.emit('entry_added', entries);
  });

  socket.on('delete_entry', (id) => {
    let entries = readEntries();
    entries = entries.filter(entry => entry.id !== id);
    writeEntries(entries);
    io.emit('entry_deleted', entries);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
