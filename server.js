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

// Eine einzige, flache Liste für alle Viren-Muster
let malwareDB = [];

// =====================
// DATENBANK LADEN (FLACHE STRUKTUR)
// =====================
function loadDatabase() {
    const dbPath = path.join(__dirname, "1.json");
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ signatures: [] }, null, 2));
        }

        const json = fs.readFileSync(dbPath, "utf8");
        // Lädt alle Einträge direkt aus dem einen "signatures"-Array
        malwareDB = JSON.parse(json).signatures || [];

        console.log(`\x1b[32m[✓] Viren-Datenbank geladen:\x1b[0m ${malwareDB.length} Muster aktiv.`);
    } catch (error) {
        console.log("\x1b[31m[-] Fehler: 1.json konnte nicht geladen werden.\x1b[0m");
        malwareDB = [];
    }
}

loadDatabase();

// =====================
// KERN-ENGINE: DER BINÄR-SCANNER
// =====================
function executeBinaryScan(fileBuffer, originalName) {
    let findings = [];

    // Berechnet SHA-256 Hash der Datei für den "hash"-Typ
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    // Wandelt Datei in Hex um für "hex"- und "text"-Typen
    const fileHex = fileBuffer.toString("hex");

    malwareDB.forEach(sig => {
        // Typ 1: Exakter Datei-Fingerabdruck (SHA-256 Hash)
        if (sig.type === "hash" && fileHash.toLowerCase() === sig.pattern.toLowerCase()) {
            findings.push({
                name: sig.name,
                risk: sig.risk || "KRITISCH",
                description: sig.description || "Identisch mit bekannter Schaddatei (Hash-Match)."
            });
        }
        
        // Typ 2: Suche nach Schadcode-Text (wird sicher in Hex gesucht)
        else if (sig.type === "text") {
            const hexPattern = Buffer.from(sig.pattern).toString("hex");
            if (fileHex.includes(hexPattern.toLowerCase())) {
                findings.push({
                    name: sig.name,
                    risk: sig.risk || "HOCH",
                    description: sig.description || "Gefährlicher Text-String im Binärcode entdeckt."
                });
            }
        }
        
        // Typ 3: Direkte Byte-Folge im Binärcode (Hex-Muster)
        else if (sig.type === "hex") {
            if (fileHex.includes(sig.pattern.toLowerCase())) {
                findings.push({
                    name: sig.name,
                    risk: sig.risk || "MITTEL",
                    description: sig.description || "Verdächtige Hex-Byte-Sequenz identifiziert."
                });
            }
        }
    });

    return { findings, fileHash };
}

// =====================
// WEB ROUTEN (API & DASHBOARD)
// =====================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Datenbank-Status an das HTML-Interface senden
app.get("/database", (req, res) => {
    // Zählt die Typen dynamisch aus der einen Liste
    const hashCount = malwareDB.filter(s => s.type === "hash").length;
    const signatureCount = malwareDB.filter(s => s.type === "hex" || s.type === "text").length;

    res.json({
        hashCount: hashCount,
        signatureCount: signatureCount,
        total: malwareDB.length
    });
});

// Datenbank über das Webinterface aktualisieren
app.get("/update", (req, res) => {
    loadDatabase();
    res.json({
        success: true,
        message: "Signatur-Datenbank wurde im laufenden Betrieb neu eingelesen."
    });
});

// Upload-Limit auf 150 MB setzen
const upload = multer({
    limits: { fileSize: 150 * 1024 * 1024 }
});

// Der primäre Scan-Endpunkt für das Web-Frontend
app.post("/api/scan", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: "Keine Datei übertragen." });
    }

    try {
        const { findings, fileHash } = executeBinaryScan(req.file.buffer, req.file.originalname);
        const isInfected = findings.length > 0;

        if (isInfected) {
            console.log(`\n\x1b[41m\x1b[37m [WEB-ALARM] \x1b[0m Infizierte Datei blockiert: ${req.file.originalname}`);
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

// Fehlerbehandlung für zu große Dateien
app.use((err, req, res, next) => {
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, error: "Datei zu groß. Maximum beträgt 150 MB." });
    }
    res.status(500).json({ success: false, error: "Unerwarteter Serverfehler." });
});

// =====================
// SERVER START & CLI-TEXTUMGEBUNG
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n\x1b[44m\x1b[37m 🛡️  NORTON ADVANCED SCANNERSUITE LIVE \x1b[0m`);
    console.log(`[*] Web-Interface erreichbar unter: http://localhost:${PORT}`);
    console.log(`----------------------------------------------------------------`);
    
    // Startet das Terminal-Menü direkt nach dem Server-Boot
    startInteractiveCLI();
});

function startInteractiveCLI() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const showMenu = () => {
        console.log("\n\x1b[1m⚡ TEXTUMGEBUNG / ADMIN KONSOLE ⚡\x1b[0m");
        console.log(" System-Status & geladene Virensignaturen anzeigen");
        console.log(" Lokale Datei direkt im Terminal prüfen");
        console.log(" Signatur-Datenbank (1.json) jetzt neu laden");
        console.log(" Virenscanner-Server sicher beenden");
    };

    showMenu();

    const handleInput = () => {
        rl.question("\n\x1b[34mBefehl (1-4) eingeben: \x1b[0m", (answer) => {
            const choice = answer.trim();

            if (choice === "1") {
                console.log(`\n\x1b[36m[STATUS]\x1b[0m Server-Port: ${PORT}`);
                console.log(`[STATUS] Gesamte Muster in flacher Liste: ${malwareDB.length}`);
                console.log(`         ⤷ Davon Dateihashes: ${malwareDB.filter(s=>s.type==="hash").length}`);
                console.log(`         ⤷ Davon Code-Muster: ${malwareDB.filter(s=>s.type!=="hash").length}`);
                handleInput();
            } 
            
            else if (choice === "2") {
                rl.question("\nAbsoluten Pfad zur Datei eingeben: ", (targetPath) => {
                    const cleanPath = targetPath.trim().replace(/^["']|["']$/g, ''); 
                    
                    if (!fs.existsSync(cleanPath)) {
                        console.log("\x1b[31m[-] Pfad existiert nicht auf diesem System.\x1b[0m");
                        handleInput();
                        return;
                    }

                    const stats = fs.statSync(cleanPath);
                    if (!stats.isFile()) {
                        console.log("\x1b[33m[-] Pfad ist ein Ordner. Bitte eine konkrete Datei angeben.\x1b[0m");
                        handleInput();
                        return;
                    }

                    console.log(`\n[*] Analysiere lokale Datei: ${path.basename(cleanPath)}...`);
                    const buffer = fs.readFileSync(cleanPath);
                    const { findings, fileHash } = executeBinaryScan(buffer, path.basename(cleanPath));
                    
                    console.log(`\x1b[90mSHA-256: ${fileHash}\x1b[0m`);
                    if (findings.length > 0) {
                        console.log(`\x1b[41m\x1b[37m 💥 GEFÄHRLICH \x1b[0m Bedrohung gefunden!`);
                        findings.forEach(f => console.log(`  ⤷ [${f.risk}] ${f.name}: ${f.description}`));
                    } else {
                        console.log(`\x1b[42m\x1b[30m ✓ SAUBER \x1b[0m Keine bekannten Bedrohungen gefunden.`);
                    }
                    handleInput();
                });
            } 
            
            else if (choice === "3") {
                console.log("\n[*] Lese Signaturdatenbank neu ein...");
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
