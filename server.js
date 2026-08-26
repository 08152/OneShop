const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname)));


/* =========================================================
   DUCKDUCKGO SUCHE
========================================================= */

app.get("/api/search", async (req, res) => {

    const query = String(req.query.q || "").trim();

    if (!query) {
        return res.status(400).json({
            error: "Bitte eine Suchanfrage eingeben."
        });
    }

    try {

        const url =
            "https://html.duckduckgo.com/html/?q=" +
            encodeURIComponent(query);


        const response = await fetch(url, {

            headers: {

                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",

                "Accept":
                    "text/html,application/xhtml+xml"

            }

        });


        if (!response.ok) {

            throw new Error(
                "DuckDuckGo HTTP " +
                response.status
            );

        }


        const html =
            await response.text();


        const results =
            parseDuckDuckGoResults(html);


        res.json({

            success: true,

            query: query,

            count: results.length,

            results: results

        });


    } catch (error) {

        console.error(
            "SEARCH ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Die Websuche konnte nicht durchgeführt werden.",

            details:
                error.message

        });

    }

});


/* =========================================================
   DUCKDUCKGO HTML AUSLESEN
========================================================= */

function parseDuckDuckGoResults(html) {

    const results = [];

    /*
        DuckDuckGo benutzt result__a für Titel/Links
        und result__snippet für Beschreibungen.
    */

    const resultBlocks =
        html.split(
            '<div class="result '
        );


    for (
        let i = 1;
        i < resultBlocks.length;
        i++
    ) {

        if (results.length >= 20) {
            break;
        }


        const block =
            resultBlocks[i];


        /*
        -----------------------------------------------
        LINK
        -----------------------------------------------
        */

        const linkMatch =
            block.match(
                /class="result__a"[^>]*href="([^"]+)"/
            );


        if (!linkMatch) {
            continue;
        }


        let url =
            decodeHTMLEntities(
                linkMatch[1]
            );


        /*
        -----------------------------------------------
        TITEL
        -----------------------------------------------
        */

        const titleMatch =
            block.match(
                /class="result__a"[^>]*>([\s\S]*?)<\/a>/
            );


        if (!titleMatch) {
            continue;
        }


        const title =
            cleanHTML(
                titleMatch[1]
            );


        /*
        -----------------------------------------------
        BESCHREIBUNG
        -----------------------------------------------
        */

        const descriptionMatch =
            block.match(
                /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
            );


        let description = "";


        if (descriptionMatch) {

            description =
                cleanHTML(
                    descriptionMatch[1]
                );

        } else {

            const divMatch =
                block.match(
                    /class="result__snippet"[^>]*>([\s\S]*?)<\/div>/
                );


            if (divMatch) {

                description =
                    cleanHTML(
                        divMatch[1]
                    );

            }

        }


        /*
        -----------------------------------------------
        DUCKDUCKGO REDIRECT URL AUFLÖSEN
        -----------------------------------------------
        */

        if (
            url.includes("uddg=")
        ) {

            try {

                const parsed =
                    new URL(url);

                const realURL =
                    parsed.searchParams.get(
                        "uddg"
                    );

                if (realURL) {

                    url =
                        decodeURIComponent(
                            realURL
                        );

                }

            } catch {

                // Original-URL behalten

            }

        }


        /*
        -----------------------------------------------
        TREFFER SPEICHERN
        -----------------------------------------------
        */

        if (
            title &&
            url
        ) {

            results.push({

                title:
                    title,

                description:
                    description ||
                    "Keine Beschreibung verfügbar.",

                url:
                    url

            });

        }

    }


    return results;

}


/* =========================================================
   HTML BEREINIGEN
========================================================= */

function cleanHTML(text) {

    return decodeHTMLEntities(
        text
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
    );

}


/* =========================================================
   HTML ENTITIES
========================================================= */

function decodeHTMLEntities(text) {

    return text

        .replace(
            /&amp;/g,
            "&"
        )

        .replace(
            /&quot;/g,
            '"'
        )

        .replace(
            /&#39;/g,
            "'"
        )

        .replace(
            /&lt;/g,
            "<"
        )

        .replace(
            /&gt;/g,
            ">"
        )

        .replace(
            /&#x27;/g,
            "'"
        )

        .replace(
            /&#x2F;/g,
            "/"
        );

}


/* =========================================================
   SERVER START
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "Lumora läuft auf Port " +
            PORT
        );

    }
);
