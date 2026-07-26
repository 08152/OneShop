const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const app = express();

// =====================
// EINSTELLUNGEN
// =====================
app.use(cors());
app.use(express.json());

// Globale Datenbankstruktur für echte Signaturen
let malwareDB = {
    hashes: [],       // Exakte Datei-Fingerabdrücke (SHA-256)
    signatures: []    // Code-Muster (Hex oder Text)
};

// =====================
// DATENBANK LADEN (ECHTE ENGINE)
// =====================
function loadDatabase() {
    const dbPath = path.join(__dirname, "1.json");
    try {
        if (!fs.existsSync(dbPath)) {
            // Erstellt eine leere Struktur, falls 1.json fehlt
            fs.writeFileSync(dbPath, JSON.stringify({ hashes: [], signatures: [] }, null, 2));
        }

        const json = fs.readFileSync(dbPath, "utf8");
        const parsed = JSON.parse(json);
        
        malwareDB.hashes = parsed.hashes || [];
        malwareDB.signatures = parsed.signatures || [];

        console.log(`\x1b[32m[✓] Malware-Datenbank erfolgreich geladen:\x1b[0m`);
        console.log(`    ⤷ Bekannte Hashes: ${malwareDB.hashes.length}`);
        console.log(`    ⤷ Code-Signaturen: ${malwareDB.signatures.length}`);
    } catch (error) {
        console.log("\x1b[31m[-] Fehler: 1.json konnte nicht korrekt verarbeitet werden.\x1b[0m");
        malwareDB = { hashes: [], signatures: [] };
    }
}

loadDatabase();

// =====================
// KERN-ENGINE: DER ECHTE BINÄR-SCANNER
// =====================
function executeBinaryScan(fileBuffer, originalName) {
    let findings = [];

    // SCHRITT 1: SHA-256 Hash berechnen (Blitzschneller Abgleich)
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    
    const hashMatch = malwareDB.hashes.find(item => item.hash.toLowerCase() === fileHash);
    if (hashMatch) {
        findings.push({
            name: hashMatch.name,
            risk: hashMatch.risk || "KRITISCH",
            description: hashMatch.description || "Exakter Treffer über Datei-Hash (100% Identifikation)."
        });
        return { findings, fileHash }; // Bei Hash-Match sofort abbrechen (höchste Präzision)
    }

    // SCHRITT 2: Binäre Signatur-Analyse (Hex-Suche)
    // Verwandelt die hochgeladene Datei in eine Hex-Kette, um Binärcode lesbar zu machen
    const fileHex = fileBuffer.toString("hex");

    malwareDB.signatures.forEach(sig => {
        let searchPattern = "";

        if (sig.isHex) {
            // Direktes Byte-Muster (z.B. "4d5a" für Windows-Executables)
            searchPattern = sig.pattern.toLowerCase();
        } else {
            // Text-Muster (z.B. "eval(base64") sicher in Hex umwandeln
            searchPattern = Buffer.from(sig.pattern).toString("hex");
        }

        if (fileHex.includes(searchPattern)) {
            findings.push({
                name: sig.name,
                risk: sig.risk || "HOCH",
                description: sig.description || "Schadcode-Muster im Binärstrom entdeckt."
            });
        }
    });

    return { findings, fileHash };
}
// =====================
// WEB ROUTEN (API)
// =====================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Datenbank-Status für Web-Anfragen
app.get("/database", (req, res) => {
    res.json({
        hashCount: malwareDB.hashes.length,
        signatureCount: malwareDB.signatures.length,
        total: malwareDB.hashes.length + malwareDB.signatures.length
    });
});

// Datenbank remote aktualisieren
app.get("/update", (req, res) => {
    loadDatabase();
    res.json({
        success: true,
        message: "Echte Malware-Datenbank wurde im laufenden Betrieb neu eingelesen."
    });
});

// Upload Limit: 150 MB im Arbeitsspeicher puffern
const upload = multer({
    limits: { fileSize: 150 * 1024 * 1024 }
});

// Der primäre Scan-Endpunkt
app.post("/api/scan", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "Keine Datei übertragen." });
    }

    try {
        // Nutzt die echte Binär-Engine aus Teil 1
        const { findings, fileHash } = executeBinaryScan(req.file.buffer, req.file.originalname);
        const isInfected = findings.length > 0;

        // Konsolen-Log für den Server-Admin im Hintergrund
        if (isInfected) {
            console.log(`\x1b[41m\x1b[37m [ALARM] \x1b[0m Infizierte Datei blockiert: ${req.file.originalname}`);
        }

        res.json({
            success: true,
            filename: req.file.originalname,
            size: req.file.size,
            sha256: fileHash,
            verdict: isInfected ? "GEFÄHRLICH" : "SAUBER",
            findings: findings
        });

    } catch (error) {
        console.error("Scan-Fehler:", error);
        res.status(500).json({ success: false, error: "Interner Fehler bei der Binäranalyse." });
    }
});

// Globale Fehlerbehandlung bei zu großen Uploads
app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, error: "Datei zu groß. Maximum beträgt 150 MB." });
    }
    res.status(500).json({ success: false, error: "Unerwarteter Serverfehler." });
});
// =====================
// SERVER START & INTERAKTIVE TEXTUMGEBUNG
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n\x1b[44m\x1b[37m 🛡️  NORTON ADVANCED SCANNERSUITE GESTARTET \x1b[0m`);
    console.log(`[*] Web-Interface erreichbar unter: http://localhost:${PORT}`);
    console.log(`----------------------------------------------------------------`);
    
    // Startet die interaktive Textumgebung direkt im Terminal
    startInteractiveCLI();
});

function startInteractiveCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const showMenu = () => {
        console.log("\n\x1b[1m⚡ TEXTUMGEBUNG / ADMIN KONSOLE ⚡\x1b[0m");
        console.log(" [1] System-Status & geladene Virensignaturen anzeigen");
        console.log(" [2] Lokale Datei oder Ordner direkt im Terminal prüfen");
        console.log(" [3] Signatur-Datenbank (1.json) jetzt neu laden");
        console.log(" [4] Virenscanner-Server sicher beenden");
    };

    showMenu();

    const handleInput = () => {
        rl.question("\n\x1b[34mBefehl (1-4) eingeben: \x1b[0m", (answer) => {
            const choice = answer.trim();

            if (choice === "1") {
                console.log(`\n\x1b[36m[STATUS]\x1b[0m Server-Port: ${PORT}`);
                console.log(`[STATUS] Registrierte Hashes: ${malwareDB.hashes.length}`);
                console.log(`[STATUS] Registrierte Signaturen: ${malwareDB.signatures.length}`);
                handleInput();
            } 
            
            else if (choice === "2") {
                rl.question("\nAbsoluten Pfad zur Datei/Ordner eingeben: ", (targetPath) => {
                    const cleanPath = targetPath.trim().replace(/^["']|["']$/g, ''); // Entfernt evtl. Anführungszeichen
                    
                    if (!fs.existsSync(cleanPath)) {
                        console.log("\x1b[31m[-] Pfad existiert nicht auf diesem System.\x1b[0m");
                        handleInput();
                        return;
                    }

                    const stats = fs.statSync(cleanPath);
                    
                    if (stats.isFile()) {
                        console.log(`\n[*] Analysiere: ${path.basename(cleanPath)}...`);
                        const buffer = fs.readFileSync(cleanPath);
                        const { findings, fileHash } = executeBinaryScan(buffer, path.basename(cleanPath));
                        
                        console.log(`\x1b[90mSHA-256: ${fileHash}\x1b[0m`);
                        if (findings.length > 0) {
                            console.log(`\x1b[41m\x1b[37m 💥 GEFÄHRLICH \x1b[0m Bedrohung gefunden!`);
                            findings.forEach(f => console.log(`  ⤷ [${f.risk}] ${f.name}: ${f.description}`));
                        } else {
                            console.log(`\x1b[42m\x1b[30m ✓ SAUBER \x1b[0m Keine bekannten Bedrohungen gefunden.`);
                        }
                    } else {
                        console.log("\x1b[33m[*] Pfad ist ein Verzeichnis. (Rekursive Ordner-Scans über CLI aus Sicherheitsgründen limitiert).\x1b[0m");
                    }
                    handleInput();
                });
            } 
            
            else if (choice === "3") {
                console.log("\n[*] Lese Signaturdateien neu ein...");
                loadDatabase();
                handleInput();
            } 
            
            else if (choice === "4") {
                console.log("\n[!] Fahre Norton Scanner Suite herunter. Auf Wiedersehen.");
                process.exit(0);
            } 
            
            else {
                console.log("\x1b[33m[-] Ungültige Auswahl. Bitte eine Zahl von 1 bis 4 eingeben.\x1b[0m");
                handleInput();
            }
        });
    };

    handleInput();
}
