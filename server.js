const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/*
    Alle Dateien liegen im selben Ordner:

    index.html
    server.js
    package.json
*/

app.use(express.static(__dirname));


/* BENUTZER */

const users = new Map();


/* Standard-Benutzer */

users.set("Haupt", {
    name: "Haupt",
    balance: 0,
    salaryDays: 0,
    expensePrice: 0,
    expenses: [0, 0, 0, 0, 0, 0, 0]
});


/* LOGIN */

app.post("/api/login", (req, res) => {

    const name = String(
        req.body.name || ""
    ).trim();

    if (!name) {
        return res.status(400).json({
            success: false,
            error: "Bitte einen Namen eingeben."
        });
    }

    if (!users.has(name)) {

        users.set(name, {
            name: name,
            balance: 0,
            salaryDays: 0,
            expensePrice: 0,
            expenses: [
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]
        });

    }

    res.json({
        success: true,
        user: users.get(name)
    });

});


/* ALLE BENUTZER */

app.get("/api/users", (req, res) => {

    res.json(
        [...users.values()]
    );

});


/* EINEN BENUTZER */

app.get("/api/users/:name", (req, res) => {

    const user =
        users.get(req.params.name);

    if (!user) {

        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });

    }

    res.json(user);

});


/* GEHALTSTAGE ÄNDERN */

app.post("/api/admin/salary-days", (req, res) => {

    if (req.body.name !== "Haupt") {

        return res.status(403).json({
            error: "Keine Berechtigung."
        });

    }

    const target =
        users.get(req.body.target);

    if (!target) {

        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });

    }

    const days =
        Number(req.body.days);

    if (!Number.isFinite(days) || days < 0) {

        return res.status(400).json({
            error: "Ungültige Anzahl."
        });

    }

    target.salaryDays =
        Math.floor(days);

    res.json({
        success: true,
        user: target
    });

});


/* AUSGABENPREIS ÄNDERN */

app.post("/api/admin/expense-price", (req, res) => {

    if (req.body.name !== "Haupt") {

        return res.status(403).json({
            error: "Keine Berechtigung."
        });

    }

    const target =
        users.get(req.body.target);

    if (!target) {

        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });

    }

    const price =
        Number(req.body.price);

    if (!Number.isFinite(price) || price < 0) {

        return res.status(400).json({
            error: "Ungültiger Preis."
        });

    }

    target.expensePrice =
        Number(price.toFixed(2));

    res.json({
        success: true,
        user: target
    });

});


/* KONTOSTAND ÄNDERN */

app.post("/api/admin/balance", (req, res) => {

    if (req.body.name !== "Haupt") {

        return res.status(403).json({
            error: "Keine Berechtigung."
        });

    }

    const target =
        users.get(req.body.target);

    if (!target) {

        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });

    }

    const balance =
        Number(req.body.balance);

    if (!Number.isFinite(balance)) {

        return res.status(400).json({
            error: "Ungültiger Kontostand."
        });

    }

    target.balance =
        Number(balance.toFixed(2));

    res.json({
        success: true,
        user: target
    });

});


/* AUSGABE */

app.post("/api/users/:name/expense", (req, res) => {

    const user =
        users.get(req.params.name);

    if (!user) {

        return res.status(404).json({
            error: "Benutzer nicht gefunden."
        });

    }

    const price =
        Number(user.expensePrice || 0);

    user.balance -= price;

    user.expenses.shift();

    user.expenses.push(price);

    res.json({
        success: true,
        user: user
    });

});


/*
    FALLBACK FÜR INDEX.HTML

    Express 5:
    NICHT app.get("*") verwenden.
*/

app.use((req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});


/* SERVER STARTEN */

app.listen(PORT, () => {

    console.log(
        `GHOST Finance läuft auf Port ${PORT}`
    );

});
