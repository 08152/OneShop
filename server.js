const express = require('express');
const brain = require('brain.js');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' })); 

let net = new brain.recurrent.LSTM();

let verlauf = {
  quellen: [],
  saetze: []
};

// Wir nutzen offene Text-APIs anstelle von verschachtelten RSS-Feeds
const quellen = [
  { name: 'Zitat-Dienst API', url: 'https://quotable.io' },
  { name: 'Krypto-News API', url: 'https://coingecko.com' },
  { name: 'Zufalls-Text Generator', url: 'https://baconipsum.com' }
];

function saubereText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z ]/g, '') // Nur Kleinbuchstaben und Leerzeichen
    .replace(/\s+/g, ' ')       
    .trim();
}

// Hilfsfunktion: Lädt rohen Text ohne SSL-Einschränkungen direkt aus dem Netz
function ladeTextAusInternet(url) {
  return new Promise((resolve, reject) => {
    const optionen = {
      rejectUnauthorized: false, // Schaltet die Render-SSL-Blockade komplett aus
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };
    
    https.get(url, optionen, (res) => {
      let daten = '';
      res.on('data', (chunk) => daten += chunk);
      res.on('end', () => resolve(daten));
    }).on('error', (e) => reject(e));
  });
});

async function durchsucheUndLerneZufaellig() {
  const zufallsIndex = Math.floor(Math.random() * quellen.length);
  const quelle = quellen[zufallsIndex];
  const zeit = new Date().toLocaleTimeString();
  
  try {
    console.log(`Lade direkt: ${quelle.name}...`);
    const roheDaten = await ladeTextAusInternet(quelle.url);
    
    // Extrahiere reinen Text (egal ob JSON-Struktur oder Rohtext)
    let gefundenerText = roheDaten;
    if (roheDaten.startsWith('{') || roheDaten.startsWith('[')) {
      // Falls JSON geliefert wurde, ziehen wir die Text-Inhalte heraus
      gefundenerText = roheDaten.replace(/"[^"]+":/g, '').replace(/[{}\[\]",]/g, ' ');
    }

    let neueSaetze = [];
    const roheSaetze = gefundenerText.split(/[.!?]+/);
    
    roheSaetze.forEach(s => {
      let sauber = saubereText(s);
      const wortAnzahl = sauber.split(' ').length;
      
      // Nur sehr kurze Sätze (2-5 Wörter), um brain.js perfekt zu füttern
      if (wortAnzahl >= 2 && wortAnzahl <= 5 && sauber.length > 5 && !neueSaetze.includes(sauber)) {
        neueSaetze.push(sauber);
      }
    });

    const auswahl = neueSaetze.slice(0, 2);

    if (auswahl.length > 0) {
      auswahl.forEach(s => {
        verlauf.saetze.unshift(`[Neu Gelernt] "${s}"`);
      });
      if (verlauf.saetze.length > 20) verlauf.saetze.pop();

      // KI trainieren
      net.train(auswahl, { 
        iterations: 12, 
        errorThresh: 0.1,
        log: false 
      });
      
      verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (${auswahl.length} Sätze gelernt)`);
      if (verlauf.quellen.length > 10) verlauf.quellen.pop();

      return { erfolg: true, anzahl: auswahl.length, quelle: quelle.name };
    }
    
    verlauf.quellen.unshift(`[${zeit}] ${quelle.name}: Text analysiert (Filter griff)`);
    return { erfolg: false };

  } catch (error) {
    verlauf.quellen.unshift(`[${zeit}] ${quelle.name} pausiert kurz (Netzwerk-Verzögerung)`);
    if (verlauf.quellen.length > 10) verlauf.quellen.pop();
    return { erfolg: false };
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/scrape-step', async (req, res) => {
  const ergebnis = await durchsucheUndLerneZufaellig();
  res.json({ ergebnis, verlauf });
});

app.get('/api/predict', (req, res) => {
  const input = req.query.text || '';
  try {
    const gereinigterInput = saubereText(input);
    const output = net.run(gereinigterInput);
    res.json({ eingabe: input, vorhersage: output });
  } catch (error) {
    res.json({ eingabe: input, vorhersage: 'KI verarbeitet Daten...' });
  }
});

app.get('/api/download-ki', (req, res) => {
  try {
    const kiGehirn = net.toJSON();
    res.setHeader('Content-disposition', 'attachment; filename=1.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(kiGehirn, null, 2));
  } catch(e) {
    res.status(500).send("Gehirn baut auf.");
  }
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
