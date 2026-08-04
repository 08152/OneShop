const express = require('express');
const brain = require('brain.js');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser({ timeout: 5000 }); // Mehr Zeit für den Download einräumen

app.use(express.json({ limit: '50mb' })); 

let net = new brain.recurrent.LSTM();

let verlauf = {
  quellen: [],
  saetze: []
};

// Bereinigte, extrem stabile Feed-Quellen (Standard-RSS2 ohne Sonderformate)
const internetFeeds = [
  { name: 'Tagesschau News', url: 'https://tagesschau.de' },
  { name: 'Wikipedia Trends', url: 'https://wikipedia.org' },
  { name: 'ZDF Heute', url: 'https://zdf.de' }
];

function saubereText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z ]/g, '') // Strikt nur Kleinbuchstaben und Leerzeichen
    .replace(/\s+/g, ' ')       
    .trim();
}

async function durchsucheUndLerneZufaellig() {
  const zufallsIndex = Math.floor(Math.random() * internetFeeds.length);
  const quelle = internetFeeds[zufallsIndex];
  const zeit = new Date().toLocaleTimeString();
  
  try {
    console.log(`Lese Quelle: ${quelle.name}...`);
    const feed = await parser.parseURL(quelle.url);
    
    let neueSaetze = [];
    
    if (feed && feed.items) {
      feed.items.forEach(item => {
        let textStueck = item.title || item.contentSnippet || '';
        // Alle HTML-Tags entfernen, falls welche im Feed stecken
        textStueck = textStueck.replace(/<\/?[^>]+(>|$)/g, "");
        
        const saetze = textStueck.split(/[.!?]+/);
        
        saetze.forEach(s => {
          let sauber = saubereText(s);
          const wortAnzahl = sauber.split(' ').length;
          
          // Nur extrem kurze, mundgerechte Sätze erlauben (2 bis 4 Wörter)
          if (wortAnzahl >= 2 && wortAnzahl <= 4 && sauber.length > 4 && !neueSaetze.includes(sauber)) {
            neueSaetze.push(sauber);
          }
        });
      });
    }

    const auswahl = neueSaetze.slice(0, 2);

    if (auswahl.length > 0) {
      auswahl.forEach(s => {
        verlauf.saetze.unshift(`[Neu Gelernt] "${s}"`);
      });
      if (verlauf.saetze.length > 20) verlauf.saetze.pop();

      // KI trainieren
      net.train(auswahl, { 
        iterations: 10, 
        errorThresh: 0.1,
        log: false 
      });
      
      verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (${auswahl.length} Sätze gelernt)`);
      if (verlauf.quellen.length > 10) verlauf.quellen.pop();

      return { erfolg: true, anzahl: auswahl.length, quelle: quelle.name };
    }
    
    verlauf.quellen.unshift(`[${zeit}] ${quelle.name}: Keine passenden Kurzsätze gefunden.`);
    return { erfolg: false, grund: 'Keine Sätze' };

  } catch (error) {
    // Sanft abfangen: Fehler loggen, aber nicht abstürzen
    verlauf.quellen.unshift(`[${zeit}] Überspringe Quelle (${quelle.name}): Datenformat unleserlich`);
    if (verlauf.quellen.length > 10) verlauf.quellen.pop();
    return { erfolg: false, grund: error.message };
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
    res.json({ eingabe: input, vorhersage: 'KI startet neu...' });
  }
});

app.get('/api/download-ki', (req, res) => {
  try {
    const kiGehirn = net.toJSON();
    res.setHeader('Content-disposition', 'attachment; filename=1.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(kiGehirn, null, 2));
  } catch(e) {
    res.status(500).send("Gehirn leer.");
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
