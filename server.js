const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));


/* =========================================================
   HILFSFUNKTION: FETCH MIT TIMEOUT
========================================================= */

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();

    const timer = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

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
   HTML ENTITIES
========================================================= */

function decodeEntities(text = "") {
    return text
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#x2F;/gi, "/")
        .replace(/&#x27;/gi, "'")
        .replace(/&#(\d+);/g, (_, n) =>
            String.fromCharCode(Number(n))
        )
        .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
            String.fromCharCode(parseInt(n, 16))
        );
}


/* =========================================================
   HTML BEREINIGEN
========================================================= */

function cleanText(text = "") {
    return decodeEntities(
        text
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
    );
}


/* =========================================================
   DDG REDIRECT URL AUFLÖSEN
========================================================= */

function resolveDuckDuckGoUrl(rawUrl) {
    if (!rawUrl) {
        return "";
    }

    let url = decodeEntities(rawUrl);

    try {
        // Absolute URL
        const parsed = new URL(url, "https://html.duckduckgo.com");

        // uddg enthält bei DDG häufig die echte Ziel-URL
        const uddg = parsed.searchParams.get("uddg");

        if (uddg) {
            return decodeURIComponent(uddg);
        }

        // Redirect-Pfade wie /l/?uddg=...
        if (parsed.hostname.includes("duckduckgo.com")) {
            return parsed.toString();
        }

        return url;
    } catch {
        return url;
    }
}


/* =========================================================
   DUCKDUCKGO HTML PARSEN
========================================================= */

function parseDuckDuckGoHtml(html) {
    const results = [];

    /*
      Normale DDG HTML-Suchergebnisse:

      .result
      .result__a
      .result__snippet
    */

    const blockRegex =
        /<div[^>]*class=["'][^"']*\bresult\b[^"']*["'][\s\S]*?<\/div>\s*<\/div>/gi;

    const blocks = html.match(blockRegex) || [];

    for (const block of blocks) {
        if (results.length >= 20) {
            break;
        }

        const linkMatch =
            block.match(
                /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i
            );

        if (!linkMatch) {
            continue;
        }

        const rawUrl = linkMatch[1];
        const titleHtml = linkMatch[2];

        const title = cleanText(titleHtml);

        const snippetMatch =
            block.match(
                /<a[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/a>/i
            ) ||
            block.match(
                /<div[^>]*class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
            );

        const description = snippetMatch
            ? cleanText(snippetMatch[1])
            : "";

        const url = resolveDuckDuckGoUrl(rawUrl);

        if (!title || !url) {
            continue;
        }

        results.push({
            title,
            description,
            url
        });
    }

    /*
      Fallback:
      Manchmal ist die DDG-HTML-Struktur leicht anders.
    */

    if (results.length === 0) {
        const linkRegex =
            /<a[^>]*class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let match;

        while (
            (match = linkRegex.exec(html)) !== null &&
            results.length < 20
        ) {
            const rawUrl = match[1];
            const title = cleanText(match[2]);

            const url = resolveDuckDuckGoUrl(rawUrl);

            if (!title || !url) {
                continue;
            }

            results.push({
                title,
                description: "",
                url
            });
        }
    }

    return results;
}


/* =========================================================
   DDG ANOMALY / BLOCK ERKENNEN
========================================================= */

function looksBlocked(html) {
    const lower = html.toLowerCase();

    return (
        lower.includes("anomaly-modal") ||
        lower.includes("captcha") ||
        lower.includes("challenge") ||
        lower.includes("select all squares") ||
        lower.includes("unusual traffic")
    );
}


/* =========================================================
   HAUPT-SUCHE
========================================================= */

async function searchDuckDuckGo(query) {
    let lastError = null;

    /*
      ==============================================
      1. DDG HTML
      ==============================================
    */

    try {
        const response = await fetchWithTimeout(
            "https://html.duckduckgo.com/html/",
            {
                method: "POST",

                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                    "Accept-Language":
                        "de-DE,de;q=0.9,en;q=0.8",

                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Referer":
                        "https://html.duckduckgo.com/",

                    "Sec-Fetch-Dest":
                        "document",

                    "Sec-Fetch-Mode":
                        "navigate",

                    "Sec-Fetch-Site":
                        "same-origin",

                    "Sec-Fetch-User":
                        "?1"
                },

                body:
                    new URLSearchParams({
                        q: query,
                        kl: "wt-wt"
                    }).toString()
            },
            10000
        );

        if (!response.ok) {
            throw new Error(
                `DuckDuckGo HTML HTTP ${response.status}`
            );
        }

        const html = await response.text();

        if (looksBlocked(html)) {
            throw new Error(
                "DuckDuckGo hat die Anfrage wegen einer Sicherheitsprüfung blockiert."
            );
        }

        const results = parseDuckDuckGoHtml(html);

        if (results.length > 0) {
            return results;
        }

        throw new Error(
            "DuckDuckGo HTML hat keine Treffer geliefert."
        );

    } catch (error) {
        lastError = error;
    }


    /*
      ==============================================
      2. DDG LITE ALS FALLBACK
      ==============================================
    */

    try {
        const response = await fetchWithTimeout(
            "https://lite.duckduckgo.com/lite/",
            {
                method: "POST",

                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",

                    "Accept":
                        "text/html,application/xhtml+xml",

                    "Accept-Language":
                        "de-DE,de;q=0.9,en;q=0.8",

                    "Content-Type":
                        "application/x-www-form-urlencoded",

                    "Referer":
                        "https://lite.duckduckgo.com/"
                },

                body:
                    new URLSearchParams({
                        q: query,
                        b: ""
                    }).toString()
            },
            10000
        );

        if (!response.ok) {
            throw new Error(
                `DuckDuckGo Lite HTTP ${response.status}`
            );
        }

        const html = await response.text();

        if (looksBlocked(html)) {
            throw new Error(
                "DuckDuckGo Lite wurde ebenfalls blockiert."
            );
        }

        const results =
            parseDuckDuckGoLiteHtml(html);

        if (results.length > 0) {
            return results;
        }

        throw new Error(
            "DuckDuckGo Lite hat keine Treffer geliefert."
        );

    } catch (error) {
        lastError = error;
    }


    throw lastError ||
        new Error("Keine Suchergebnisse verfügbar.");
}


/* =========================================================
   DDG LITE PARSEN
========================================================= */

function parseDuckDuckGoLiteHtml(html) {
    const results = [];

    /*
      Lite-Ergebnisse verwenden häufig
      result-link / result-snippet.
    */

    const linkRegex =
        /<a[^>]*href=["']([^"']+)["'][^>]*class=["'][^"']*result-link[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
        (match = linkRegex.exec(html)) !== null &&
        results.length < 20
    ) {
        const rawUrl = match[1];
        const title = cleanText(match[2]);

        const after =
            html.slice(
                match.index,
                match.index + 5000
            );

        const snippetMatch =
            after.match(
                /class=["'][^"']*result-snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:td|div)>/i
            );

        const description =
            snippetMatch
                ? cleanText(snippetMatch[1])
                : "";

        const url =
            resolveDuckDuckGoUrl(rawUrl);

        if (!title || !url) {
            continue;
        }

        results.push({
            title,
            description,
            url
        });
    }

    /*
      Zweiter Lite-Fallback
    */

    if (results.length === 0) {
        const genericLinks =
            html.match(
                /<a[^>]+href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi
            ) || [];

        for (const link of genericLinks) {
            if (results.length >= 20) {
                break;
            }

            const hrefMatch =
                link.match(
                    /href=["']([^"']+)["']/i
                );

            if (!hrefMatch) {
                continue;
            }

            const title =
                cleanText(link);

            if (
                title.length < 3 ||
                title.length > 250
            ) {
                continue;
            }

            const url =
                resolveDuckDuckGoUrl(
                    hrefMatch[1]
                );

            if (!url) {
                continue;
            }

            if (
                url.includes("duckduckgo.com")
            ) {
                continue;
            }

            results.push({
                title,
                description: "",
                url
            });
        }
    }

    return results;
}


/* =========================================================
   API ENDPOINT
========================================================= */

app.get("/api/search", async (req, res) => {
    const query =
        String(req.query.q || "")
            .trim()
            .slice(0, 499);

    if (!query) {
        return res.status(400).json({
            success: false,
            error: "Keine Suchanfrage."
        });
    }

    try {
        console.log(
            `[SEARCH] ${query}`
        );

        const results =
            await searchDuckDuckGo(query);

        console.log(
            `[SEARCH] ${results.length} Treffer`
        );

        res.json({
            success: true,
            query,
            count: results.length,
            results
        });

    } catch (error) {
        console.error(
            "[SEARCH ERROR]",
            error.message
        );

        res.status(502).json({
            success: false,
            query,
            error:
                error.name === "AbortError"
                    ? "Die Websuche wurde nach 10 Sekunden beendet."
                    : error.message
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
