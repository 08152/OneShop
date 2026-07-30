const express = require('express');
const path = require('path');
const sendmail = require('sendmail')({ silent: true });
const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt Express das Lesen von Formulardaten aus der HTML
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 1. ROUTE: Liefert die getrennte index.html an den Browser aus
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. ROUTE: Verarbeitet das Formular und generiert das E-Mail-Design
app.post('/send-email', (req, res) => {
    const { to, subject, vonWunschName, messageText } = req.body;

    if (!to || !subject || !vonWunschName || !messageText) {
        return res.status(400).send('<h1>Fehler: Alle Felder müssen ausgefüllt sein!</h1><a href="/">Zurück</a>');
    }

    const generierteAbsenderAdresse = `${vonWunschName.trim()}@://onrender.com`;

    // Das grüne HTML-Design für das Postfach des Empfängers
    const formatiertesHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, sans-serif;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden;">
                        <tr>
                            <td align="center" style="background-color: #10b981; padding: 40px 20px; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 26px; font-weight: bold;">OneShop Benachrichtigung</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                                <h2 style="margin-top: 0; color: #1f2937;">Hallo!</h2>
                                <p style="font-size: 16px; color: #4b5563;">Du hast eine neue Nachricht über das OneShop-System erhalten:</p>
                                
                                <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; font-style: italic; color: #1f2937;">
                                    ${messageText.replace(/\n/g, '<br>')}
                                </div>

                                <p style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">Klicke auf den Button unten, um direkt zu deiner Finanz-Übersicht zu gelangen:</p>
                                
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="https://://onrender.com" target="_blank" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Zum Finanz-Dashboard</a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px;">
                                <p style="margin: 0 0 5px 0;">Gesendet von: ${generierteAbsenderAdresse}</p>
                                <p style="margin: 0;">&copy; 2026 OneShop. Alle Rechte vorbehalten.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // Der kostenlose Sendevorgang direkt ins Web
    sendmail({
        from: generierteAbsenderAdresse,
        to: to,
        subject: subject,
        html: formatiertesHtml
    }, function (err, reply) {
        if (err) {
            console.error('Sende-Fehler:', err);
            return res.status(500).send(`<h1>Fehler beim Senden!</h1><p>${err.message}</p><a href="/">Zurück</a>`);
        }
        
        res.send(`
            <div style="font-family:Arial; text-align:center; padding:50px;">
                <h1 style="color:#10b981;">&check; E-Mail erfolgreich generiert!</h1>
                <p>Die HTML-Nachricht wurde von <strong>${generierteAbsenderAdresse}</strong> abgeschickt.</p>
                <br>
                <a href="/" style="background-color:#10b981; color:white; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold;">Weitere E-Mail senden</a>
            </div>
        `);
    });
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
