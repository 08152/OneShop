const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;


/*
    Dateien werden nur temporär im Arbeitsspeicher gehalten.
    Sie werden nicht auf der Festplatte gespeichert.
*/

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowed = [
            ".txt",
            ".eml"
        ];

        const extension =
            path.extname(file.originalname)
                .toLowerCase();

        if (!allowed.includes(extension)) {
            return cb(
                new Error(
                    "Nur TXT- und EML-Dateien sind erlaubt."
                )
            );
        }

        cb(null, true);
    }
});


app.use(express.json());

app.use(express.static(
    path.join(__dirname)
));


/*
    E-Mail analysieren
*/

app.post(
    "/api/analyze-mail",
    upload.single("mail"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    error: "Keine E-Mail-Datei hochgeladen."
                });

            }


            let text =
                req.file.buffer.toString("utf8");


            /*
                Sehr einfache EML-Verarbeitung.
                Für die Demo werden Header und Body getrennt.
            */

            let subject = "";
            let body = text;


            const subjectMatch =
                text.match(
                    /^Subject:\s*(.*)$/im
                );


            if (subjectMatch) {
                subject = subjectMatch[1].trim();
            }


            const separator =
                text.search(/\r?\n\r?\n/);


            if (separator !== -1) {

                body =
                    text.substring(
                        separator
                    ).trim();

            }


            /*
                E-Mail-Text begrenzen,
                damit extrem große Dateien
                nicht unnötig verarbeitet werden.
            */

            body = body.substring(0, 20000);


            const lower =
                body.toLowerCase();


            let intent =
                "Allgemeine Anfrage";

            let priority =
                "Normal";


            if (
                lower.includes("dringend") ||
                lower.includes("sofort") ||
                lower.includes("asap")
            ) {

                priority = "Hoch";

            }


            if (
                lower.includes("rechnung") ||
                lower.includes("zahlung") ||
                lower.includes("preis")
            ) {

                intent =
                    "Frage zu Rechnung, Zahlung oder Preis";

            }
            else if (
                lower.includes("termin") ||
                lower.includes("meeting")
            ) {

                intent =
                    "Termin- oder Besprechungsanfrage";

            }
            else if (
                lower.includes("problem") ||
                lower.includes("fehler") ||
                lower.includes("funktioniert nicht")
            ) {

                intent =
                    "Problem oder Support-Anfrage";

            }
            else if (
                lower.includes("angebot")
            ) {

                intent =
                    "Angebotsanfrage";

            }


            /*
                Antwortvorschlag.
                Das ist bewusst eine einfache lokale
                Demo-KI und noch keine externe LLM.
            */

            const reply =
`Hallo,

vielen Dank für Ihre Nachricht.

ich habe Ihr Anliegen erhalten und verstanden, dass es sich um folgende Anfrage handelt:

${intent}.

Wir prüfen die Angelegenheit und melden uns schnellstmöglich mit weiteren Informationen bei Ihnen.

Viele Grüße
Ihr Unternehmen`;


            res.json({

                success: true,

                subject:
                    subject || "Kein Betreff erkannt",

                intent: intent,

                priority: priority,

                reply: reply

            });

        }
        catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Die E-Mail konnte nicht analysiert werden."
            });

        }

    }
);


/*
    Fehlerbehandlung für Uploads
*/

app.use(
    (err, req, res, next) => {

        console.error(err);

        res.status(400).json({
            error:
                err.message ||
                "Unbekannter Fehler."
        });

    }
);


/*
    Server starten
*/

app.listen(
    PORT,
    () => {

        console.log(
            `AI Control Center läuft auf Port ${PORT}`
        );

    }
);
