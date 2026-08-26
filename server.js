const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// index.html und alle anderen Dateien aus dem Projektordner bereitstellen
app.use(express.static(path.join(__dirname)));

// Startseite
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Test-Endpunkt
app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        service: "RiskyLive",
        time: new Date().toISOString()
    });
});

// Server starten
app.listen(PORT, "0.0.0.0", () => {
    console.log(`RiskyLive läuft auf Port ${PORT}`);
});
