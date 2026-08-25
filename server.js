const express = require("express");
const path = require("path");
const cheerio = require("cheerio");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname)));


/*
==================================================
DUCKDUCKGO NORMALE SUCHERGEBNISSE
==================================================
*/

app.get("/api/search", async (req, res) => {

    const query = String(req.query.q || "").trim();

    if (!query) {
        return res.status(400).json({
            error: "Keine Suchanfrage."
        });
    }

    try {

        const searchUrl =
            "https://html.duckduckgo.com/html/?" +
            new URLSearchParams({
                q: query
            }).toString();


        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml"
            }
        });


        if (!response.ok) {
            throw new Error(
                `DuckDuckGo HTTP ${response.status}`
            );
        }


        const html = await response.text();

        const $ = cheerio.load(html);

        const results = [];


        /*
        ------------------------------------------
        Suchergebnisse auslesen
        ------------------------------------------
        */

        $(".result").each((index, element) => {

            if (results.length >= 20) {
                return;
            }


            const result = $(element);


            let title =
                result
                    .find(".result__title")
                    .text()
                    .trim();


            let link =
                result
                    .find(".result__a")
                    .attr("href");


            let description =
                result
                    .find(".result__snippet")
                    .text()
                    .trim();


            /*
            Alternative Selektoren,
            falls DuckDuckGo die Struktur verändert.
            */

            if (!title) {
                title =
                    result
                        .find("a")
                        .first()
                        .text()
                        .trim();
            }


            if (!link) {
                link =
                    result
                        .find("a")
                        .first()
                        .attr("href");
            }


            /*
            DuckDuckGo kann Weiterleitungs-URLs liefern.
            */

            if (
                link &&
                link.includes("uddg=")
            ) {

                try {

                    const parsed =
                        new URL(link);

                    const realUrl =
                        parsed.searchParams.get("uddg");

                    if (realUrl) {
                        link = decodeURIComponent(realUrl);
                    }

                } catch (error) {
                    // URL bleibt unverändert
                }

            }


            /*
            Nur brauchbare Treffer übernehmen.
            */

            if (title && link) {

                results.push({
                    title,
                    description,
                    url: link
                });

            }

        });


        res.json({
            query,
            count: results.length,
            results
        });


    } catch (error) {

        console.error(
            "Suchfehler:",
            error
        );


        res.status(500).json({
            error:
                "DuckDuckGo konnte nicht erreicht werden.",
            details:
                error.message
        });

    }

});


/*
==================================================
SERVER
==================================================
*/

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Lumora läuft auf Port ${PORT}`
        );

    }
);
