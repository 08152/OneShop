const express = require('express');
// Initialisiert das sendmail-Modul (ohne SMTP-Konfiguration)
const sendmail = require('sendmail')({ silent: true }); 
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Die Hauptseite für deine Render-URL https://onrender.com
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>OneShop Mail System</title></head>
        <body style="font-family:Arial; text-align:center; padding:50px;">
            <h1>OneShop Mail-Zentrale aktiv</h1>
            <p>Sende einen POST-Request an <code>/send-email</code> um Nachrichten direkt zu generieren.</p>
        </body>
        </html>
    `);
});

// API-Endpunkt: Erstellt E-Mails komplett selbstständig
app.post('/send-email', (req, res) => {
    const { to, subject, vonWunschName } = req.body;

    if (!to || !subject || !vonWunschName) {
        return res.status(400).json({ error: 'Bitte "to", "subject" und "vonWunschName" angeben.' });
    }

    // Hier generierst du deine eigene Wunsch-E-Mail-Adresse im Code
    const freiErfundenerAbsender = `${vonWunschName}@://onrender.com`;

    // Der HTML-Inhalt, der direkt mitgeschickt wird
    const htmlInhalt = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 40px; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
            <tr>
                <td align="center" style="background-color: #10b981; padding: 40px 20px; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 26px;">Dein Finanz-Dashboard</h1>
                </td>
            </tr>
            <tr>
                <td style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                    <h2>Willkommen bei OneShop!</h2>
                    <p>Diese E-Mail wurde ohne externe Webseiten oder SMTP-Dienste generiert.</p>
                    <p>Klicke auf den Button, um zu deiner Übersicht zu gelangen:</p>
                    <br>
                    <p align="center">
                        <a href="https://onrender.com" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Zum Finanz-Dashboard</a>
                    </p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // Sendmail-Befehl ausführen (kontaktiert den Empfänger-Server direkt)
    sendmail({
        from: freiErfundenerAbsender,
        to: to,
        subject: subject,
        html: htmlInhalt
    }, function (err, reply) {
        if (err) {
            console.error('Fehler:', err);
            return res.status(500).json({ success: false, error: err.message });
        }
        console.dir(reply);
        return res.status(200).json({ 
            success: true, 
            message: `E-Mail wurde erfolgreich von ${freiErfundenerAbsender} generiert und versendet!` 
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
