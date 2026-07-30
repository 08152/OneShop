const express = require('express');
const nodemailer = require('nodemailer');
const SMTPServer = require('smtp-server').SMTPServer;

const app = express();
app.use(express.json());

const HTTP_PORT = process.env.PORT || 3000;
const SMTP_PORT = 2525; // Der Port für deinen eigenen Mail-Versand

// 1. HTTP-WEBSEITE (OneShop Dashboard)
app.get('/', (req, res) => {
    res.send('<h1>OneShop Finanz-Dashboard</h1><p>Der eigene E-Mail-Server läuft im Hintergrund.</p>');
});

// HTML-E-Mail-Template für dein Dashboard
const emailTemplate = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>OneShop Dashboard</title>
</head>
<body style="margin:0; padding:40px; background-color:#f3f4f6; font-family:Arial,sans-serif;">
    <table align="center" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
        <tr>
            <td align="center" style="background-color:#10b981; padding:40px 20px; color:#ffffff;">
                <h1 style="margin:0; font-size:26px;">Dein Finanz-Dashboard</h1>
            </td>
        </tr>
        <tr>
            <td style="padding:40px 30px; color:#333333; line-height:1.6;">
                <h2>Willkommen bei OneShop!</h2>
                <p>Du hast diese Nachricht direkt von unserem komplett eigenen, selbstgebauten E-Mail-Server erhalten.</p>
                <p>Klicke unten, um direkt zu deiner Finanz-Übersicht zu gelangen:</p>
                <br>
                <p align="center">
                    <a href="https://onrender.com" target="_blank" style="background-color:#10b981; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">Zum Finanz-Dashboard</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

// API-Endpunkt zum Verschicken über deinen eigenen Mail-Server
app.post('/send-email', async (req, res) => {
    const { to, subject, vonWunschName } = req.body;

    if (!to || !subject || !vonWunschName) {
        return res.status(400).json({ error: 'Bitte "to", "subject" und "vonWunschName" angeben.' });
    }

    try {
        // Verbindung zu deinem lokal laufenden SMTP-Server herstellen
        const transporter = nodemailer.createTransport({
            host: 'localhost',
            port: SMTP_PORT,
            secure: false, // Keine externe Verschlüsselung für die interne Weiterleitung benötigt
            tls: { rejectUnauthorized: false }
        });

        // Hier erstellst du dynamisch JEDE beliebige Adresse mit deiner Domain!
        // Beispiel: "chef@://onrender.com" oder "support@://onrender.com"
        const eigeneGenerierteAdresse = `${vonWunschName}@://onrender.com`;

        const mailOptions = {
            from: eigeneGenerierteAdresse, 
            to: to,
            subject: subject,
            html: emailTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({ 
            success: true, 
            message: `E-Mail erfolgreich von ${eigeneGenerierteAdresse} gesendet!`,
            messageId: info.messageId 
        });

    } catch (error) {
        console.error('Fehler beim Versenden:', error);
        return res.status(500).json({ error: 'Mail-Server-Fehler', details: error.message });
    }
});

// 2. DEIN EGENER SMTP-MAIL-SERVER (Empfängt und verarbeitet die Mails)
const mailServer = new SMTPServer({
    disabledCommands: ['STARTTLS', 'AUTH'], // Erlaubt lokales Senden ohne Passwort-Zwang
    onData(stream, session, callback) {
        let buffer = '';
        stream.on('data', (chunk) => { buffer += chunk; });
        stream.on('end', () => {
            console.log('--- EIGENE MAIL GENERIERT UND VERARBEITET ---');
            console.log(buffer); // Zeigt die rohe E-Mail in den Render-Logs an
            callback();
        });
    }
});

// HTTP-Server starten
app.listen(HTTP_PORT, () => {
    console.log(`Webseite läuft auf Port ${HTTP_PORT}`);
});

// SMTP-Server starten
mailServer.listen(SMTP_PORT, () => {
    console.log(`Eigener SMTP-Mail-Server aktiv auf Port ${SMTP_PORT}`);
});
