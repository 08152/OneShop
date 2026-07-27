const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Start-Benutzerliste (jetzt leer, da sich jeder selbst registriert)
let usersData = [];

// API: Alle Benutzer abrufen
app.get('/api/users', (req, res) => {
    res.json(usersData);
});

// NEU - API: Einen neuen Benutzer registrieren
app.post('/api/users/register', (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name darf nicht leer sein" });
    }

    // Neue ID generieren
    const newId = usersData.length > 0 ? usersData[usersData.length - 1].id + 1 : 1;
    
    const newUser = {
        id: newId,
        name: name.trim(),
        balance: 0.00, // Startet bei 0€
        expenses: 0.00,
        nextSalary: "Noch nicht festgelegt",
        history: [],
        contracts: []
    };

    usersData.push(newUser);
    res.json({ success: true, user: newUser });
});

// API: Änderungen vom Admin-Panel speichern
app.post('/api/users/update', (req, res) => {
    const { id, salary, nextSalary, contractName, contractPrice, expenseName, expenseAmount } = req.body;
    const user = usersData.find(u => u.id === parseInt(id));

    if (!user) return res.status(404).json({ error: "Nutzer nicht gefunden" });

    if (salary && parseFloat(salary) > 0) {
        user.balance += parseFloat(salary);
        user.history.push({ type: 'Einnahme', name: 'Gehalt ausgezahlt', amount: parseFloat(salary) });
    }
    if (nextSalary) user.nextSalary = nextSalary;
    if (contractName && parseFloat(contractPrice) > 0) {
        user.contracts.push({ name: contractName, price: parseFloat(contractPrice) });
    }
    if (expenseName && parseFloat(expenseAmount) > 0) {
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

app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
