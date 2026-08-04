const express = require('express');
const cheerio = require('cheerio');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Eine breite Liste mit zufälligen Begriffen für die Wikipedia-Suche
const randomKeywords = [
    "Technologie", "Zukunft", "Wissenschaft", "Universum", "Philosophie", 
    "Geschichte", "Informatik", "Roboter", "Klimawandel", "Erde", 
    "Medizin", "Biologie", "Quantenphysik", "Astronomie", "Archäologie",
    "Psychologie", "Kultur", "Kunst", "Ozean", "Evolution", "Energie",
    "Quantencomputer", "Neurologie", "Weltall", "Menschheit", "Zivilisation"
];

// Hilfsfunktion: Führt einen HTTPS-Request mit nativem Node.js aus (absturzsicher)
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            timeout: 6000
        };

        https.get(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Status Code: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (err) => {
            reject(err);
        });
    });
}
