const express = require('express');
const brain = require('brain.js');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser({ timeout: 4000 }); // Etwas mehr Zeit für langsame Leitungen

app.use(express.json({ limit: '100mb' })); 

let net = new brain.recurrent.LSTM();

let verlauf = {
  quellen: [],
  saetze: []
};

const internetFeeds = [
  { name: 'Heise Tech', url: 'https://heise.de' },
  { name: 'Spiegel Netzwelt', url: 'https://spiegel.de' },
  { name: 'Tagesschau', url: 'https://tagesschau.de' },
  { name: 'Golem IT', url: 'https://golem.de' },
  { name: 'Wired Tech', url: 'https://wired.com' },
  { name: 'BBC News', url: 'http://bbci.co.uk' }
];

function saubereText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, '') 
    .replace(/\s+/g, ' ')       
    .trim();
}

async function durchsucheUndLerneZufaellig() {
  const zufallsIndex = Math.floor(Math.random() * internetFeeds.length);
  const quelle = internetFeeds[zufallsIndex];
  
  try {
    console.log(`Scrape läuft auf: ${quelle.name}...`);
    const feed = await parser.parseURL(quelle.url);
    
    let neueSaetze = [];
    const zeit = new Date().toLocaleTimeString();
    
    feed.items.forEach(item => {
      let textStueck = item.title || '';
      if (item.contentSnippet) textStueck += ' ' + item.contentSnippet;
      
      const saetze = textStueck.split(/[.!?]+/);
      saetze.forEach(s => {
        let sauber = saubereText(s);
        const wortAnzahl = sauber.split(' ').length;
        // Wichtig: Sätze dürfen nicht zu lang sein, sonst stürzt der RAM ab!
        if (wortAnzahl >= 3 && wortAnzahl <= 8 && !neueSaetze.includes(sauber)) {
          neueSaetze.push(sauber);
        }
      });
    });

    // Nur maximal 5 Sätze auf einmal lernen (schont den kostenlosen Render-Server)
    const auswahl = neueSaetze.slice(0, 5);

    if (auswahl.length > 0) {
      auswahl.forEach(s => {
        verlauf.saetze.unshift(`[Neu Gelernt] "${s}"`);
      });
      if (verlauf.saetze.length > 30) verlauf.saetze.pop();

      // KI-Modell trainieren
      net.train(auswahl, { 
        iterations: 10, // Weniger Runden = Viel schneller und materialschonender
        errorThresh: 0.08,
        log: false 
      });
      
      verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (${auswahl.length} Sätze gelernt)`);
      if (verlauf.quellen.length > 15) verlauf.quellen.pop();

      return { erfolg: true, anzahl: auswahl.length, quelle: quelle.name };
    }
    
    verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (Keine passenden Sätze gefunden)`);
    return { erfolg: false, grund: 'Keine passenden Sätze im Text gefunden.' };
  } catch (error) {
    const zeit = new Date().toLocaleTimeString();
    verlauf.quellen.unshift(`[${zeit}] Fehler bei ${quelle.name}: ${error.message}`);
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

app.get('/api/status', (req, res) => {
  res.json(verlauf);
});

app.get('/api/predict', (req, res) => {
  const input = req.query.text || '';
  try {
    const gereinigterInput = saubereText(input);
    const output = net.run(gereinigterInput);
    res.json({ eingabe: input, vorhersage: output });
  } catch (error) {
    res.json({ eingabe: input, vorhersage: 'KI lernt noch oder Gehirn ist leer...' });
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
