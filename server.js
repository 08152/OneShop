const express = require('express');
const brain = require('brain.js');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser();

app.use(express.json({ limit: '50mb' }));

let net = new brain.recurrent.LSTM();

// Standard-Startdaten
let trainingsDaten = ['ki lernt das internet', 'automatische daten suche läuft'];

// HILFSFUNKTION: Holt Texte aus dem Internet und bereitet sie für die KI vor
async function holeInternetDaten() {
  try {
    console.log('--- Suche im Internet nach neuen Lerndaten... ---');
    // Wir nutzen einen freien RSS-Newsfeed (z.B. von Heise Developer / Technologie)
    const feed = await parser.parseURL('https://heise.de');
    
    const neueSaetze = [];
    
    // Gehe durch die neuesten Internet-Artikel
    feed.items.forEach(item => {
      if (item.title) {
        // Text säubern: Nur Kleinbuchstaben und Leerzeichen für brain.js erlauben
        let saubererText = item.title
          .toLowerCase()
          .replace(/[^a-zäöüß ]/g, '') // Entfernt Sonderzeichen und Zahlen
          .trim();
        
        if (saubererText.length > 5 && neueSaetze.length < 15) {
          neueSaetze.push(saubererText);
        }
      }
    });

    if (neueSaetze.length > 0) {
      trainingsDaten = neueSaetze;
      console.log(`Erfolg! ${trainingsDaten.length} Sätze aus dem Internet geladen:`, trainingsDaten);
      
      // KI automatisch mit den Internetdaten trainieren
      console.log('--- Automatisches Training startet ---');
      net = new brain.recurrent.LSTM(); // Modell zurücksetzen für frische Daten
      net.train(trainingsDaten, { iterations: 80, log: true, logPeriod: 40 });
      console.log('--- Automatisches Internet-Training beendet! ---');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Internetdaten:', error.message);
  }
}

// Beim Serverstart direkt einmal das Internet durchsuchen und lernen
holeInternetDaten();

// Web-Routen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// NEU: Endpunkt, um die KI manuell anzuweisen, das Internet neu zu durchsuchen
app.post('/api/auto-learn', async (req, res) => {
  await holeInternetDaten();
  res.json({ status: 'success', daten: trainingsDaten });
});

app.get('/api/predict', (req, res) => {
  const input = req.query.text || 'ki ';
  try {
    const output = net.run(input.toLowerCase().replace(/[^a-zäöüß ]/g, ''));
    res.json({ eingabe: input, vorhersage: output });
  } catch (error) {
    res.json({ eingabe: input, vorhersage: 'Fehler: KI-Gehirn wird noch trainiert.' });
  }
});

app.get('/api/download-ki', (req, res) => {
  const kiGehirn = net.toJSON();
  res.setHeader('Content-disposition', 'attachment; filename=1.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(kiGehirn, null, 2));
});

app.post('/api/upload-ki', (req, res) => {
  try {
    net = new brain.recurrent.LSTM();
    net.fromJSON(req.body);
    res.json({ status: 'success' });
  } catch (error) {
    res.status(400).json({ status: 'error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
