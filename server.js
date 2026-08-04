const express = require('express');
const brain = require('brain.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Wichtig: Ermöglicht es dem Server, JSON-Daten im Request-Body zu empfangen
app.use(express.json({ limit: '50mb' }));

let net = new brain.recurrent.LSTM();

// Standard-Training beim Start (falls noch keine Datei hochgeladen wurde)
const trainingsDaten = [
  'ki ist super',
  'ki kann lernen',
  'coder bauen software',
  'render hostet apps'
];

console.log('--- Initiales KI-Training startet ---');
net.train(trainingsDaten, { iterations: 100 });
console.log('--- Initiales KI-Training beendet! ---');

// HTML-Seite ausliefern
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API für die KI-Abfrage
app.get('/api/predict', (req, res) => {
  const input = req.query.text || 'ki ';
  try {
    const output = net.run(input);
    res.json({ eingabe: input, vorhersage: output });
  } catch (error) {
    res.json({ eingabe: input, vorhersage: 'Fehler: KI-Modell nicht bereit.' });
  }
});

// API für den JSON-Download
app.get('/api/download-ki', (req, res) => {
  const kiGehirn = net.toJSON();
  res.setHeader('Content-disposition', 'attachment; filename=1.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(kiGehirn, null, 2));
});

// NEU: API-Endpunkt für den JSON-Upload
app.post('/api/upload-ki', (req, res) => {
  try {
    const jsonDaten = req.body;
    
    // Neues Modell instanziieren und die hochgeladenen Daten einlesen
    net = new brain.recurrent.LSTM();
    net.fromJSON(jsonDaten);
    
    console.log('--- KI-Modell erfolgreich aus JSON geladen! ---');
    res.json({ status: 'success', message: 'KI-Daten erfolgreich geladen!' });
  } catch (error) {
    console.error('Fehler beim Laden der JSON:', error);
    res.status(400).json({ status: 'error', message: 'Ungültige KI-Datei.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
