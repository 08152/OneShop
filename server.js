const express = require('express');
const brain = require('brain.js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// KI-Modell für Version 1.6.0 initialisieren
const net = new brain.recurrent.LSTM();

// Trainingsdaten
const trainingsDaten = [
  'ki ist super',
  'ki kann lernen',
  'ki wird immer schlauer',
  'coder bauen software',
  'coder schreiben sauberen code',
  'javascript läuft auf dem server',
  'javascript ist perfekt für das web',
  'render hostet apps',
  'render macht deployment einfach'
];

console.log('--- KI-Training startet ---');
net.train(trainingsDaten, { 
  iterations: 150,
  log: true,
  logPeriod: 50 
});
console.log('--- KI-Training beendet! ---');

// HTML-Seite ausliefern
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API für die KI-Abfrage
app.get('/api/predict', (req, res) => {
  const input = req.query.text || 'ki ';
  const output = net.run(input);
  res.json({ eingabe: input, vorhersage: output });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
