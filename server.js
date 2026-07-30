const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 3000;

// Erlaubt das Lesen von JSON-Daten im Request-Body
app.use(express.json());

// Einfacher Test-Endpunkt für den Browser
app.get('/', (req, res) => {
    res.send('Dein E-Mail Server läuft erfolgreich auf Render!');
});

// API-Endpunkt zum Senden der HTML-E-Mail
app.post('/send-email', align, async (req, res) => {
    const { to, subject, htmlContent } = req.body;

    // Validierung der Pflichtfelder
    if (!to || !subject) {
        return res.status(400).json({ error: 'Bitte "to" und "subject" angeben.' });
    }

    // Standard-HTML-Template, falls kein eigenes mitgeschickt wird
    const defaultHtml = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Willkommen bei unserem Service</title>
    </head>
    <body style="margin: 0; padding: 0; width: 100% !important; background-color: #f3f4f6; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                        <tr>
                            <td align="center" style="background-color: #4f46e5; padding: 40px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">Dein Neuer Account</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px; background-color: #ffffff;">
                                <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; font-weight: 700;">Hallo und Willkommen!</h2>
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                    Herzlichen Glückwunsch! Dein neuer E-Mail-Account wurde erfolgreich eingerichtet und mit deinem Server auf <strong>Render</strong> verknüpft.
                                </p>
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                                    Ab jetzt kannst du vollautomatisch wunderschöne HTML-Nachrichten über deine eigene GitHub-Pipeline verschicken.
                                </p>
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center" style="padding-bottom: 12px;">
                                            <a href="https://github.com" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block;">
                                                Zum GitHub Repository
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 30px;">
                                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 0;">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px; background-color: #fafafa;">
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Status:</strong> Aktiv & Betriebsbereit</p>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Server:</strong> Node.js via Render Hosting</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 30px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">Diese E-Mail wurde automatisch generiert.</p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; 2026 Dein Projekt. Alle Rechte vorbehalten.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        // SMTP-Konfiguration über die Render-Umgebungsvariablen
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true für Port 465, false für Port 587
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // E-Mail-Optionen definieren
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: to,
            subject: subject,
            html: htmlContent || defaultHtml // Nutzt mitgeschicktes HTML oder die Vorlage oben
        };

        // E-Mail absenden
        const info = await transporter.sendMail(mailOptions);
        return res.status(200).json({ 
            success: true, 
            message: 'E-Mail erfolgreich gesendet!', 
            messageId: info.messageId 
        });

    } catch (error) {
        console.error('Fehler beim E-Mail-Versand:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Senden der E-Mail.', 
            details: error.message 
        });
    }
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
