const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/*
    DEMO-DATEN

    Für eine echte Produktionsversion sollte hier
    eine Datenbank wie PostgreSQL verwendet werden.
*/

const users = new Map();

users.set("Haupt", {
    name: "Haupt",
    balance: 0,
    salaryDays: 0,
    expensePrice: 0,
    expenses: [0, 0, 0, 0, 0, 0, 0]
});


/* LOGIN */

app.post("/api/login", (req, res) => {

    const name = String(req.body.name || "").trim();

    if (!name) {
        return res.status(400).json({
            success: false,
            error: "Bitte einen Namen eingeben."
        });
    }

    if (!users.has(name)) {
        users.set(name, {
            name,
            balance: 0,
            salaryDays: 0,
            expensePrice: 0,
            expenses: [0, 0, 0, 0, 0, 0, 0]
        });
    }

    const user = users.get(name);

    res.json({
        success: true,
        user
    });
});


/* ALLE ANGEMELDETEN */

app.get("/api/users", (req, res) => {

    const list = [...users.values()].map(user => ({
        name: user.name,
        balance: user.balance,
        salaryDays: user.salaryDays,
        expensePrice: user.expensePrice,
        expenses: user.expenses
    }));

    res.json(list);
});


/* BENUTZER ABRUFEN */

app.get("/api/users/:name", (req, res) => {

    const user = users.get(req.params.name);

    if (!user) {
        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });
    }

    res.json(user);
});


/*
    HAUPT:
    Gehalts-Tage einstellen
*/

app.post("/api/admin/salary-days", (req, res) => {

    const { name, days } = req.body;

    if (name !== "Haupt") {
        return res.status(403).json({
            error: "Keine Berechtigung."
        });
    }

    const target = users.get(req.body.target);

    if (!target) {
        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });
    }

    const value = Number(days);

    if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
            error: "Ungültige Anzahl."
        });
    }

    target.salaryDays = Math.floor(value);

    res.json({
        success: true,
        user: target
    });
});


/*
    HAUPT:
    Preis für Ausgaben einstellen
*/

app.post("/api/admin/expense-price", (req, res) => {

    const { name, price } = req.body;

    if (name !== "Haupt") {
        return res.status(403).json({
            error: "Keine Berechtigung."
        });
    }

    const target = users.get(req.body.target);

    if (!target) {
        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });
    }

    const value = Number(price);

    if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
            error: "Ungültiger Preis."
        });
    }

    target.expensePrice = Number(value.toFixed(2));

    res.json({
        success: true,
        user: target
    });
});


/*
    AUSGABE FÜR BENUTZER EINTRAGEN

    Der Preis wird dabei automatisch
    vom Hauptkonto festgelegt.
*/

app.post("/api/users/:name/expense", (req, res) => {

    const user = users.get(req.params.name);

    if (!user) {
        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });
    }

    const price = user.expensePrice;

    user.balance -= price;

    user.expenses.shift();
    user.expenses.push(price);

    res.json({
        success: true,
        user
    });
});


/*
    KONTOSTAND SETZEN
*/

app.post("/api/admin/balance", (req, res) => {

    if (req.body.name !== "Haupt") {
        return res.status(403).json({
            error: "Keine Berechtigung."
        });
    }

    const target = users.get(req.body.target);

    if (!target) {
        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });
    }

    const balance = Number(req.body.balance);

    if (!Number.isFinite(balance)) {
        return res.status(400).json({
            error: "Ungültiger Kontostand."
        });
    }

    target.balance = Number(balance.toFixed(2));

    res.json({
        success: true,
        user: target
    });
});


/*
    FALLBACK
*/

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.listen(PORT, () => {
    console.log(`GHOST Finance läuft auf Port ${PORT}`);
});
