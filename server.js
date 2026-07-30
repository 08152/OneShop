const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt das Lesen von JSON-Daten im Body
app.use(express.json());

// Einfacher Test-Endpunkt für den Browser
app.get('/', (req, res) => {
    res.send('E-Mail Server läuft erfolgreich!');
});

// API-Endpunkt zum Senden der HTML-E-Mail
app.post('/send-email', async (req, res) => {
    const { to, subject, htmlContent } = req.body;

    if (!to || !subject || !htmlContent) {
        return res.status(400).json({ error: 'Bitte "to", "subject" und "htmlContent" angeben.' });
    }

    try {
        // Konfiguration des E-Mail-Transporters über Umgebungsvariablen
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,       // z.B. ://gmail.com oder mail.gmx.net
            port: parseInt(process.env.EMAIL_PORT) || 587, 
            secure: process.env.EMAIL_SECURE === 'true', // true für Port 465, false für andere
            auth: {
                user: process.env.EMAIL_USER,   // Deine E-Mail-Adresse
                pass: process.env.EMAIL_PASS    // Dein Passwort oder App-Passwort
            }
        });

        // E-Mail Optionen festlegen
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent // Hier wird der HTML-Code gerendert
        };

        // E-Mail senden
        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'E-Mail erfolgreich gesendet!', messageId: info.messageId });

    } catch (error) {
        console.error('Fehler beim E-Mail-Versand:', error);
        return res.status(500).json({ error: 'Fehler beim Senden der E-Mail.', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
