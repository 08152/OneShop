const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname)));


/* =========================================================
   FETCH MIT TIMEOUT
========================================================= */

async function fetchWithTimeout(url, options = {}, timeout = 8000) {

    const controller = new AbortController();

    const timer = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {

        return await fetch(url, {
            ...options,
            signal: controller.signal
        });

    } finally {

        clearTimeout(timer);

    }
}


/* =========================================================
   TEXT BEREINIGEN
========================================================= */

function cleanText(value) {

    if (!value) return "";

    return String(value)
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================================
   RELATED TOPICS FLACH MACHEN
========================================================= */

function flattenTopics(topics, output = []) {

    if (!Array.isArray(topics)) {
        return output;
    }

    for (const topic of topics) {

        if (!topic) continue;

        if (topic.Text && topic.FirstURL) {

            output.push({
                title: cleanText(topic.Text),
                url: topic.FirstURL,
                description: cleanText(topic.Text)
            });

        }

        if (Array.isArray(topic.Topics)) {

            flattenTopics(
                topic.Topics,
                output
            );

        }

    }

    return output;

}


/* =========================================================
   DUCKDUCKGO JSON
========================================================= */

async function searchDuckDuckGo(query) {

    const url =
        "https://api.duckduckgo.com/?" +
        new URLSearchParams({

            q: query,

            format: "json",

            no_html: "1",

            no_redirect: "1",

            skip_disambig: "0"

        }).toString();


    const response =
        await fetchWithTimeout(
            url,
            {
                method: "GET",

                headers: {
                    "Accept": "application/json",

                    "User-Agent":
                        "Lumora-AI/1.0"
                }
            },
            8000
        );


    if (!response.ok) {

        throw new Error(
            `DuckDuckGo HTTP ${response.status}`
        );

    }


    const data =
        await response.json();


    const results = [];


    /* =====================================================
       DIREKTE ANTWORT
    ===================================================== */

    if (data.Answer) {

        results.push({

            type: "answer",

            title:
                data.AnswerType
                    ? cleanText(data.AnswerType)
                    : "Direkte Antwort",

            text:
                cleanText(data.Answer),

            source:
                data.AnswerURL || "",

            sourceName:
                data.AnswerSource || ""

        });

    }


    /* =====================================================
       ABSTRACT / ZUSAMMENFASSUNG
    ===================================================== */

    if (
        data.AbstractText ||
        data.Abstract
    ) {

        results.push({

            type: "abstract",

            title:
                cleanText(
                    data.Heading ||
                    "Zusammenfassung"
                ),

            text:
                cleanText(
                    data.AbstractText ||
                    data.Abstract
                ),

            source:
                data.AbstractURL || "",

            sourceName:
                data.AbstractSource || ""

        });

    }


    /* =====================================================
       RELATED TOPICS
    ===================================================== */

    const related =
        flattenTopics(
            data.RelatedTopics || []
        );


    for (
        const item of related.slice(0, 12)
    ) {

        results.push({

            type: "topic",

            title:
                item.title,

            text:
                item.description,

            source:
                item.url,

            sourceName:
                "DuckDuckGo"

        });

    }


    /* =====================================================
       IMAGE
    ===================================================== */

    let image = null;

    if (data.Image) {

        image = {

            url: data.Image,

            width:
                data.ImageWidth || null,

            height:
                data.ImageHeight || null

        };

    }


    return {

        query,

        heading:
            cleanText(
                data.Heading || ""
            ),

        image,

        results,

        hasAnswer:
            Boolean(
                data.Answer ||
                data.AbstractText ||
                data.Abstract
            )

    };

}


/* =========================================================
   API
========================================================= */

app.get("/api/search", async (req, res) => {

    const query =
        String(
            req.query.q || ""
        )
        .trim()
        .slice(0, 500);


    if (!query) {

        return res.status(400).json({

            success: false,

            error:
                "Keine Suchanfrage."

        });

    }


    console.log(
        `[SEARCH] ${query}`
    );


    try {

        const data =
            await searchDuckDuckGo(
                query
            );


        console.log(
            `[SEARCH] Antwort erhalten`
        );


        return res.json({

            success: true,

            ...data

        });


    } catch (error) {

        console.error(
            "[SEARCH ERROR]",
            error
        );


        let message =
            "Die Websuche konnte nicht durchgeführt werden.";


        if (
            error.name ===
            "AbortError"
        ) {

            message =
                "DuckDuckGo hat nicht rechtzeitig geantwortet.";

        }


        return res.status(502).json({

            success: false,

            error: message

        });

    }

});


/* =========================================================
   START
========================================================= */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Lumora läuft auf Port ${PORT}`
        );

    }
);
