const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

/*
    HTML ausliefern
*/
app.use(express.static(path.join(__dirname)));


/*
    DuckDuckGo Instant Answer API

    Beispiel:
    /api/search?q=three.js
*/
app.get("/api/search", async (req, res) => {

    const query = String(req.query.q || "").trim();

    if (!query) {
        return res.status(400).json({
            error: "Keine Suchanfrage angegeben."
        });
    }

    try {

        const url =
            "https://api.duckduckgo.com/?" +
            new URLSearchParams({
                q: query,
                format: "json",
                no_html: "1",
                skip_disambig: "0"
            });

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `DuckDuckGo HTTP ${response.status}`
            );
        }

        const data = await response.json();

        res.json(data);

    } catch (error) {

        console.error("DuckDuckGo Fehler:", error);

        res.status(500).json({
            error: "Die Suche konnte nicht durchgeführt werden."
        });
    }
});


/*
    Start
*/
app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Lumora läuft auf Port ${PORT}`
    );

});
