const express = require('express');
const brain = require('brain.js');
const path = require('path');
const Parser = require('rss-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser({ timeout: 3000 }); // Schnelles Timeout für Highspeed-Scraping

// Höheres Limit für den Upload, da die 1.json durch das Internet-Lernen sehr groß wird
app.use(express.json({ limit: '100mb' })); 

let net = new brain.recurrent.LSTM();

// Speicher für das Live-Dashboard im Frontend
let verlauf = {
  quellen: [],
  saetze: []
};

// Eine Liste mit verschiedenen Internet-Quellen für die Zufallssuche
const internetFeeds = [
  { name: 'Heise Tech', url: 'https://heise.de' },
  { name: 'Spiegel Netzwelt', url: 'https://spiegel.de' },
  { name: 'Tagesschau', url: 'https://tagesschau.de' },
  { name: 'Golem IT', url: 'https://golem.de' },
  { name: 'Wired Tech', url: 'https://wired.com' },
  { name: 'BBC News', url: 'http://bbci.co.uk' }
];

// Hilfsfunktion zum Säubern von Texten (wichtig für die brain.js Zeichenerkennung)
function saubereText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, '') // Nur Kleinbuchstaben, Umlaute und Leerzeichen erlauben
    .replace(/\s+/g, ' ')       // Doppelte Leerzeichen entfernen
    .trim();
}

// Die Core-Funktion: Sucht im Internet und lernt extrem schnell
async function durchsucheUndLerneZufaellig() {
  // Wähle eine zufällige Quelle aus der Liste aus
  const zufallsIndex = Math.floor(Math.random() * internetFeeds.length);
  const quelle = internetFeeds[zufallsIndex];
  
  try {
    console.log(`Scrape läuft auf: ${quelle.name}...`);
    const feed = await parser.parseURL(quelle.url);
    
    let neueSaetze = [];
    
    // Protokolliere die durchsuchte Quelle für das Live-Dashboard
    const zeit = new Date().toLocaleTimeString();
    verlauf.quellen.unshift(`[${zeit}] ${quelle.name} (${feed.items.length} Artikel gescannt)`);
    if (verlauf.quellen.length > 15) verlauf.quellen.pop(); // Begrenzen, um RAM zu sparen

    // Sätze extrahieren und säubern
    feed.items.forEach(item => {
      let textStueck = item.title || '';
      if (item.contentSnippet) textStueck += ' ' + item.contentSnippet;
      
      // Text in einzelne Sätze splitten
      const saetze = textStueck.split(/[.!?]+/);
      
      saetze.forEach(s => {
        let sauber = saubereText(s);
        // Nur Sätze mit 3 bis 12 Wörtern aufnehmen (Perfekt für schnelles Training)
        const wortAnzahl = sauber.split(' ').length;
        if (wortAnzahl >= 3 && wortAnzahl <= 12 && !neueSaetze.includes(sauber)) {
          neueSaetze.push(sauber);
        }
      });
    });

    // Nur maximal 10 Sätze pro Durchgang lernen, damit der kostenlose Render-Server stabil bleibt
    const auswahl = neueSaetze.slice(0, 10);

    if (auswahl.length > 0) {
      // Protokolliere die gelernten Sätze für das Frontend
      auswahl.forEach(s => {
        verlauf.saetze.unshift(`[Neu Gelernt] "${s}"`);
      });
      if (verlauf.saetze.length > 30) verlauf.saetze.pop();

      // KI trainieren (Wenige Iterationen, damit die Endlosschleife flüssig durchläuft)
      net.train(auswahl, { 
        iterations: 15, 
        errorThresh: 0.05,
        log: false 
      });
      
      return { erfolg: true, anzahl: auswahl.length, quelle: quelle.name };
    }
    return { erfolg: false, grund: 'Keine passenden Sätze im Text gefunden.' };
  } catch (error) {
    console.error(`Fehler beim Scrapen von ${quelle.name}:`, error.message);
    return { erfolg: false, grund: error.message };
  }
}

// ROUTE: Liefert die grafische Weboberfläche aus
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API: Einzelschritt für die Endlosschleife im Frontend
app.post('/api/scrape-step', async (req, res) => {
  const ergebnis = await durchsucheUndLerneZufaellig();
  res.json({ ergebnis, verlauf });
});

// API: Statusabruf für das Dashboard
app.get('/api/status', (req, res) => {
  res.json(verlauf);
});

// API: Satz vervollständigen
app.get('/api/predict', (req, res) => {
  const input = req.query.text || '';
  try {
    const gereinigterInput = saubereText(input);
    const output = net.run(gereinigterInput);
    res.json({ eingabe: input, vorhersage: output });
  } catch (error) {
    res.json({ eingabe: input, vorhersage: 'KI-Gehirn baut sich gerade auf oder ist noch leer...' });
  }
});

// API: Die trainierten KI-Daten als 1.json herunterladen
app.get('/api/download-ki', (req, res) => {
  try {
    const kiGehirn = net.toJSON();
    res.setHeader('Content-disposition', 'attachment; filename=1.json');
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(kiGehirn, null, 2));
  } catch(e) {
    res.status(500).send("Das Modell besitzt noch kein Wissen. Lass die KI erst arbeiten!");
  }
});

// API: Eine bestehende 1.json wieder hochladen, um darauf weiterzulernen
app.post('/api/upload-ki', (req, res) => {
  try {
    net = new brain.recurrent.LSTM();
    net.fromJSON(req.body);
    console.log('--- Bestehendes KI-Gehirn erfolgreich aus Datei geladen! ---');
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Fehler beim JSON-Upload:', error);
    res.status(400).json({ status: 'error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft erfolgreich auf Port ${PORT}`);
});
