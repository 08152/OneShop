const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt dem Server, JSON-Daten zu empfangen
app.use(express.json());

// Die zentralen Benutzerdaten auf dem Server (Startwerte)
let usersData = [
    { 
        id: 1, 
        name: "Max Mustermann", 
        balance: 1450.00, 
        expenses: 550.00, 
        nextSalary: "27. August 2026", 
        history: [
            {type: 'Ausgabe', name: 'Miete', amount: 490.00}, 
            {type: 'Ausgabe', name: 'Supermarkt', amount: 60.00}
        ], 
        contracts: [
            {name: "Mobilfunk", price: 24.99}
        ] 
    },
    { 
        id: 2, 
        name: "Anna Schmidt", 
        balance: 2100.00, 
        expenses: 120.00, 
        nextSalary: "01. September 2026", 
        history: [
            {type: 'Ausgabe', name: 'Streaming', amount: 15.00}
        ], 
        contracts: [] 
    }
];

// API: Alle Benutzer abrufen
app.get('/api/users', (req, res) => {
    res.json(usersData);
});

// API: Änderungen vom Admin-Panel speichern
app.post('/api/users/update', (req, res) => {
    const { id, salary, nextSalary, contractName, contractPrice, expenseName, expenseAmount } = req.body;
    const user = usersData.find(u => u.id === parseInt(id));

    if (!user) {
        return res.status(404).json({ error: "Nutzer nicht gefunden" });
    }

    // Gehalt verarbeiten
    if (salary && salary > 0) {
        user.balance += parseFloat(salary);
        user.history.push({ type: 'Einnahme', name: 'Gehalt ausgezahlt', amount: parseFloat(salary) });
    }
    
    // Nächstes Gehaltsdatum
    if (nextSalary) {
        user.nextSalary = nextSalary;
    }
    
    // Vertrag hinzufügen
    if (contractName && contractPrice > 0) {
        user.contracts.push({ name: contractName, price: parseFloat(contractPrice) });
    }

    // Reine Ausgabe hinzufügen
    if (expenseName && expenseAmount > 0) {
        user.balance -= parseFloat(expenseAmount);
        user.expenses += parseFloat(expenseAmount);
        user.history.push({ type: 'Ausgabe', name: expenseName, amount: parseFloat(expenseAmount) });
    }

    res.json({ success: true, user });
});

// HTML-Seiten ausliefern
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/vermoegen.html', (req, res) => res.sendFile(path.join(__dirname, 'vermoegen.html')));
app.get('/vertraege.html', (req, res) => res.sendFile(path.join(__dirname, 'vertraege.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
