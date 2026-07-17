// server.js

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// JSON-Dateien lesen
app.use(express.json());

// Alle Dateien aus diesem Ordner bereitstellen
app.use(express.static(__dirname));

// Wissen aus 1.json laden
let knowledge = { knowledge: [] };

function loadKnowledge() {
    try {
        knowledge = JSON.parse(fs.readFileSync(path.join(__dirname, "1.json"), "utf8"));
        console.log("1.json erfolgreich geladen.");
    } catch (err) {
        console.log("Fehler beim Laden von 1.json:", err.message);
        knowledge = { knowledge: [] };
    }
}

loadKnowledge();

// API: Wissen abrufen
app.get("/api/data", (req, res) => {
    res.json(knowledge);
});

// API: Wissen neu laden (praktisch nach Änderungen an 1.json)
app.get("/api/reload", (req, res) => {
    loadKnowledge();
    res.json({
        success: true,
        message: "1.json neu geladen."
    });
});

// Startseite
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Chatseite
app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "chat.html"));
});

// Fehlerseite
app.use((req, res) => {
    res.status(404).send("404 - Seite nicht gefunden");
});

// Server starten
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("MiniKI gestartet");
    console.log("Port:", PORT);
    console.log("Öffne: http://localhost:" + PORT);
    console.log("--------------------------------");
});
