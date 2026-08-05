const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Liefert deine index.html auf der Startseite (/) aus
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API-Endpunkt: Generiert exakt 25 einzigartige Sätze pro Begriff
app.get('/api/crawl', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Kein Suchbegriff angegeben.' });
    }

    // Exakt 25 unterschiedliche Satzmuster für das KI-Training
    const generierteSaetze = [
        `Das Thema ${query} enthält wichtige mathematische Strukturen und Datenmuster.`,
        `Künstliche Intelligenz lernt durch Vektoren alles über ${query}.`,
        `Die Analyse von ${query} hilft dem neuronalen Netz beim Verstehen der Welt.`,
        `Ein Algorithmus verarbeitet Informationen bezüglich ${query} in Echtzeit.`,
        `Im mathematischen Raum liegen Konzepte über ${query} nah beieinander.`,
        `Ein tiefes neuronales Netz strukturiert die Datenmuster von ${query}.`,
        `Statistische Wahrscheinlichkeiten bestimmen die Relevanz von ${query}.`,
        `Das System optimiert seine Gewichte mithilfe der Fehlerkorrektur zu ${query}.`,
        `Die Verlustfunktion berechnet den genauen Fehlerwert für ${query}.`,
        `Durch Vektorisierung wird das Konzept von ${query} für Maschinen lesbar.`,
        `Informationen über ${query} werden in numerische Matrizen transformiert.`,
        `Der Trainingsprozess integriert neue Erkenntnisse über das Thema ${query}.`,
        `Mustererkennung bildet das Fundament für die Kategorisierung von ${query}.`,
        `Ein Sprachmodell berechnet die logische Wortfolge rund um ${query}.`,
        `Die Gewichte im Netzwerk passen sich dynamisch an Daten von ${query} an.`,
        `Die Generalisierung erlaubt es der KI, unbekannte Muster von ${query} zu deuten.`,
        `Ein mathematischer Vektor bildet die semantische Bedeutung von ${query} ab.`,
        `Die Verarbeitung von ${query} erfordert eine saubere Datenaufbereitung.`,
        `Der Algorithmus sucht nach verborgenen Zusammenhängen im Bereich ${query}.`,
        `Durch Backpropagation lernt die künstliche Intelligenz aus Fehlern zu ${query}.`,
        `Der globale Wortschatz wird durch Kernbegriffe von ${query} erweitert.`,
        `Die logische Struktur von ${query} wird in binäre Zahlenschichten zerlegt.`,
        `Maschinelles Lernen ermöglicht präzise Vorhersagen über Entwicklungen von ${query}.`,
        `Die künstliche Intelligenz speichert die statistische Häufigkeit von ${query}.`,
        `Am Ende des Prozesses versteht das Modell die mathematische Relation zu ${query}.`
    ];

    res.json({ saetze: generierteSaetze });
});

app.listen(PORT, () => {
    console.log(`Server läuft erfolgreich auf Port ${PORT}`);
});
