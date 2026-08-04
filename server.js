const express = require('express');
const brain = require('brain.js');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser({ timeout: 4000 });

app.use(express.json({ limit: '50mb' })); 

let net = new brain.recurrent.LSTM();

let verlauf = {
  quellen: [],
  saetze: []
};

const internetFeeds = [
  { name: 'Heise Tech', url: 'https://heise.de' },
  { name: 'Spiegel Netzwelt', url: 'https://spiegel.de' },
  { name: 'Tagesschau', url: 'https://tagesschau.de' },
  { name: 'Golem IT', url: 'https://golem.de' }
];

// Erlaubt NUR die absolut häufigsten Buchstaben, um das Vokabular klein zu halten
function saubereText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z ]/g, '') // Entfernt Umlaute/Sonderzeichen, da diese brain.js crashen lassen
    .replace(/\s+/g, ' ')       
    .trim();
}

async function durchsucheUndLerneZufaellig() {
  const zufallsIndex = Math.floor(Math.random() * internetFeeds.length);
  const quelle = internetFeeds[zufallsIndex];
  const zeit = new Date().toLocaleTimeString();
  
  try {
    console.log(`Scrape läuft auf: ${quelle.name}...`);
    const feed = await parser.parseURL(quelle.url);
    
    let neueSaetze = [];
    
    feed.items.forEach(item => {
      let textStueck = item.title || '';
      const saetze = textStueck.split(/[.!?]+/);
      
      saetze.forEach(s => {
        let sauber = saubereText(s);
        const wortAnzahl = sauber.split(' ').length;
        
        // STRENGER FILTER: Nur kurze Sätze mit maximal 5 einfachen Wörtern erlauben!
        if (wortAnzahl >= 2 && wortAnzahl <= 5 && sauber.length > 5 && !neueSaetze.includes(sauber)) {
          neueSaetze.push(sauber);
        }
      });
    });

    // Nur maximal 2 Sätze pro Durchgang lernen, um den RAM zu schonen!
    const auswahl = neueSaetze.slice(0, 2);

    if (auswahl.length > 0) {
      auswahl.forEach(s => {
        verlauf.saetze.unshift(`[Neu Gelernt] "${s}"`);
      });
      if (verlauf.saetze.length > 20) verlauf.saetze.pop();

      // KI-Modell sicher trainieren
      net.train(auswahl, { 
        iterations: 8, // Sehr wenige Iterationen verhindern den Absturz
        errorThresh: 0.1,
        log: false 
      });
      
      verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (${auswahl.length} Sätze gelernt)`);
      if (verlauf.quellen.length > 10) verlauf.quellen.pop();

      return { erfolg: true, anzahl: auswahl.length, quelle: quelle.name };
    }
    
    return { erfolg: false, grund: 'Keine mundgerechten Sätze gefunden.' };
  } catch (error) {
    // Falls das Modell wegen Überlastung crasht, setzen wir es hier automatisch zurück
    if (error.message.includes('size') || error.message.includes('memory')) {
      net = new brain.recurrent.LSTM(); 
      verlauf.quellen.unshift(`[${zeit}] ⚠️ Speicher voll! KI-Modell wurde automatisch bereinigt.`);
    } else {
      verlauf.quellen.unshift(`[${zeit}] Fehler bei ${quelle.name}: ${error.message}`);
    }
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
