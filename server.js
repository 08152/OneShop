/**
 * server.js - Node.js Express Server für Render.com Deploys
 */

const express = require('express');
const path = require('path');
const app = express();

// Render setzt dynamisch Umgebungsvariablen für den Port
const PORT = process.env.PORT || 3000;

// Statische Dateien direkt aus dem Hauptordner ausliefern
app.use(express.static(path.join(__dirname, '.')));

// Explizite Auslieferung der node_modules für Leaflet-Assets (optional nutzbar)
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Catch-All-Route: Sendet bei unbekannten URLs die index.html zurück (SPA Fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server auf der Host-Schnittstelle 0.0.0.0 starten (wichtig für Render Container)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Navigations-Server läuft erfolgreich auf Port ${PORT}`);
});
