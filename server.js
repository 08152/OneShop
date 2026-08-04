const brain = require('brain.js');

// 1. Neues neuronale Netzwerk für Text/Sequenzen erstellen (LSTM)
const net = new brain.recurrent.LSTM();

// 2. Die "riesigen Textmengen" (unsere Trainingsdaten)
// Die KI lernt hier die Struktur von einfachen Sätzen
const trainingsDaten = [
  'ki ist super',
  'ki kann lernen',
  'coder bauen software',
  'javascript läuft auf dem server'
];

console.log('--- Training startet ---');
console.log('Bitte warten, die KI lernt gerade den Text...');

// 3. Das Training (Pre-training auf Sparflamme)
// iterations: Wie oft die KI den Text liest (mehr = besseres Lernen)
net.train(trainingsDaten, {
  iterations: 150,
  log: (stats) => console.log(stats)
});

console.log('--- Training abgeschlossen! ---');

// 4. Der Test: Die KI soll das nächste Wort vorhersagen
const startText = 'ki ';
const vorhersage = net.run(startText);

console.log(`Eingabe: "${startText}"`);
console.log(`KI-Vorhersage für das nächste Wort: "${vorhersage}"`);
