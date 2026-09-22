"use strict";

const express = require("express");
const multer = require("multer");
const AdmZip = require("adm-zip");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFile } = require("child_process");

const app = express();
const PORT = process.env.PORT || 10000;

/*
  Upload-Limit:
  ZIP: maximal 100 MB
*/
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024
    }
});

app.use(express.static(__dirname));

/*
  Erlaubte Web-Dateien
*/
const allowedExtensions = new Set([
    ".html",
    ".htm",
    ".css",
    ".js",
    ".mjs",
    ".json",

    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".svg",
    ".ico",

    ".woff",
    ".woff2",
    ".ttf",
    ".otf",

    ".mp3",
    ".wav",
    ".ogg",

    ".mp4",
    ".webm"
]);

/*
  Ausführbare Dateien blockieren
*/
const blockedExtensions = new Set([
    ".exe",
    ".dll",
    ".bat",
    ".cmd",
    ".com",
    ".scr",
    ".msi",

    ".ps1",
    ".vbs",
    ".vbe",
    ".jscript",
    ".jse",
    ".wsf",
    ".wsh",

    ".jar",
    ".apk",

    ".sh",
    ".bash",

    ".so",
    ".dylib",
    ".sys",
    ".ocx"
]);

/*
  Generierte Dateien
*/
const generatedFiles = new Map();

/*
  JSON-Antwort immer korrekt senden
*/
function sendJSON(res, status, data) {

    if (res.headersSent) {
        return;
    }

    res.status(status);

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    res.end(
        JSON.stringify(data)
    );
}

/*
  7-Zip finden
*/
function find7z() {

    const possible = [
        process.env.SEVEN_ZIP_PATH,

        "/usr/bin/7z",
        "/usr/local/bin/7z",
        "/bin/7z",

        "/usr/bin/7zz",
        "/usr/local/bin/7zz",
        "/bin/7zz"
    ].filter(Boolean);

    for (const file of possible) {

        try {

            if (fs.existsSync(file)) {
                return file;
            }

        } catch {}
    }

    return null;
}

/*
  7-Zip-SFX-Modul finden
*/
function findSFX() {

    const possible = [

        process.env.SFX_PATH,

        "/usr/lib/p7zip/7zS.sfx",
        "/usr/lib/7zip/7zS.sfx",

        "/opt/7zip/7zS.sfx",

        "/usr/local/lib/p7zip/7zS.sfx",

        path.join(__dirname, "7zS.sfx")

    ].filter(Boolean);

    for (const file of possible) {

        try {

            if (fs.existsSync(file)) {
                return file;
            }

        } catch {}
    }

    return null;
}

/*
  ZIP überprüfen
*/
function validateZip(zip) {

    const entries = zip.getEntries();

    if (!entries.length) {

        throw new Error(
            "Die ZIP-Datei ist leer."
        );
    }

    /*
      Maximal 1000 Dateien
    */
    if (entries.length > 1000) {

        throw new Error(
            "Die ZIP-Datei enthält mehr als 1000 Dateien."
        );
    }

    /*
      Maximal 250 MB entpackt
    */
    const MAX_TOTAL_SIZE =
        250 * 1024 * 1024;

    let totalSize = 0;
    let htmlFile = null;

    for (const entry of entries) {

        const rawName =
            entry.entryName || "";

        const normalized =
            rawName
                .replace(/\\/g, "/")
                .replace(/^\/+/g, "");

        /*
          Path Traversal verhindern
        */
        if (
            normalized.startsWith("../") ||
            normalized.includes("/../") ||
            normalized === ".." ||
            path.posix.isAbsolute(normalized)
        ) {

            throw new Error(
                "Unsicherer Dateipfad in der ZIP: " +
                rawName
            );
        }

        if (entry.isDirectory) {
            continue;
        }

        const ext =
            path.posix
                .extname(normalized)
                .toLowerCase();

        /*
          Ausführbare Dateien ablehnen
        */
        if (blockedExtensions.has(ext)) {

            throw new Error(
                "Nicht erlaubte ausführbare Datei gefunden: " +
                rawName
            );
        }

        /*
          Nur Web-Dateien erlauben
        */
        if (!allowedExtensions.has(ext)) {

            throw new Error(
                "Nicht unterstützte Datei gefunden: " +
                rawName
            );
        }

        const size =
            Number(entry.header.size || 0);

        totalSize += size;

        if (totalSize > MAX_TOTAL_SIZE) {

            throw new Error(
                "Der entpackte Inhalt darf maximal 250 MB groß sein."
            );
        }

        /*
          Startseite bestimmen
        */
        if (
            normalized.toLowerCase() ===
            "index.html"
        ) {

            htmlFile = normalized;

        } else if (
            !htmlFile &&
            (
                ext === ".html" ||
                ext === ".htm"
            )
        ) {

            htmlFile = normalized;
        }
    }

    if (!htmlFile) {

        throw new Error(
            "Keine HTML-Datei gefunden. " +
            "Die ZIP muss mindestens eine HTML-Datei enthalten."
        );
    }

    return {
        entries,
        htmlFile,
        totalSize
    };
}

/*
  ZIP entpacken
*/
function extractZip(zip, folder) {

    const entries = zip.getEntries();

    const root =
        path.resolve(folder);

    for (const entry of entries) {

        if (entry.isDirectory) {
            continue;
        }

        const relative =
            entry.entryName
                .replace(/\\/g, "/")
                .replace(/^\/+/g, "");

        const destination =
            path.resolve(
                folder,
                relative
            );

        /*
          Zusätzlicher Sicherheitscheck
        */
        if (
            destination !== root &&
            !destination.startsWith(
                root + path.sep
            )
        ) {

            throw new Error(
                "Unsicherer Dateipfad."
            );
        }

        fs.mkdirSync(
            path.dirname(destination),
            {
                recursive: true
            }
        );

        const data =
            entry.getData();

        fs.writeFileSync(
            destination,
            data
        );
    }
}

/*
  7-Zip-Archiv erstellen
*/
function createArchive(
    sevenZip,
    folder,
    archive
) {

    return new Promise(
        (resolve, reject) => {

            execFile(
                sevenZip,

                [
                    "a",
                    "-t7z",
                    "-mx=5",
                    archive,
                    "."
                ],

                {
                    cwd: folder,

                    timeout:
                        180000,

                    maxBuffer:
                        10 * 1024 * 1024
                },

                (
                    error,
                    stdout,
                    stderr
                ) => {

                    if (error) {

                        reject(
                            new Error(
                                "7-Zip konnte das Archiv nicht erstellen.\n" +
                                (
                                    stderr ||
                                    error.message
                                )
                            )
                        );

                        return;
                    }

                    resolve();
                }
            );
        }
    );
}

/*
  SFX-EXE erstellen
*/
function createExe(
    sfx,
    archive,
    config,
    output
) {

    return new Promise(
        (resolve, reject) => {

            try {

                const sfxData =
                    fs.readFileSync(sfx);

                const configData =
                    Buffer.from(
                        config,
                        "utf8"
                    );

                const archiveData =
                    fs.readFileSync(archive);

                const outputData =
                    Buffer.concat([
                        sfxData,
                        configData,
                        archiveData
                    ]);

                fs.writeFileSync(
                    output,
                    outputData
                );

                resolve();

            } catch (error) {

                reject(error);
            }
        }
    );
}

/*
  ZIP → EXE
*/
app.post(
    "/api/build",

    upload.single("zip"),

    async (req, res) => {

        let workDir = null;

        try {

            /*
              Prüfen, ob Datei vorhanden
            */
            if (!req.file) {

                return sendJSON(
                    res,
                    400,
                    {
                        ok: false,
                        error:
                            "Keine ZIP-Datei hochgeladen."
                    }
                );
            }

            console.log(
                "ZIP erhalten:",
                req.file.originalname,
                req.file.size,
                "Bytes"
            );

            /*
              ZIP öffnen
            */
            let zip;

            try {

                zip =
                    new AdmZip(
                        req.file.buffer
                    );

            } catch (error) {

                return sendJSON(
                    res,
                    400,
                    {
                        ok: false,
                        error:
                            "Die ZIP-Datei konnte nicht gelesen werden."
                    }
                );
            }

            /*
              ZIP überprüfen
            */
            const info =
                validateZip(zip);

            console.log(
                "ZIP geprüft:",
                info.entries.length,
                "Dateien"
            );

            console.log(
                "HTML:",
                info.htmlFile
            );

            console.log(
                "Entpackte Größe:",
                info.totalSize,
                "Bytes"
            );

            /*
              7-Zip suchen
            */
            const sevenZip =
                find7z();

            if (!sevenZip) {

                return sendJSON(
                    res,
                    500,
                    {
                        ok: false,
                        error:
                            "7-Zip wurde auf dem Render-Server nicht gefunden."
                    }
                );
            }

            /*
              SFX suchen
            */
            const sfx =
                findSFX();

            if (!sfx) {

                return sendJSON(
                    res,
                    500,
                    {
                        ok: false,
                        error:
                            "Das 7-Zip-SFX-Modul 7zS.sfx wurde nicht gefunden."
                    }
                );
            }

            console.log(
                "7-Zip:",
                sevenZip
            );

            console.log(
                "SFX:",
                sfx
            );

            /*
              Zufällige ID
            */
            const id =
                crypto
                    .randomBytes(16)
                    .toString("hex");

            /*
              Temporärer Arbeitsordner
            */
            workDir =
                path.join(
                    os.tmpdir(),
                    "zip-exe-" + id
                );

            fs.mkdirSync(
                workDir,
                {
                    recursive: true
                }
            );

            const filesDir =
                path.join(
                    workDir,
                    "files"
                );

            fs.mkdirSync(
                filesDir,
                {
                    recursive: true
                }
            );

            /*
              ZIP entpacken
            */
            console.log(
                "Entpacke ZIP..."
            );

            extractZip(
                zip,
                filesDir
            );

            /*
              7z-Datei erstellen
            */
            const archive =
                path.join(
                    workDir,
                    "app.7z"
                );

            console.log(
                "Erstelle 7z-Archiv..."
            );

            await createArchive(
                sevenZip,
                filesDir,
                archive
            );

            /*
              Prüfen
            */
            if (
                !fs.existsSync(archive)
            ) {

                throw new Error(
                    "Das 7z-Archiv wurde nicht erstellt."
                );
            }

            /*
              HTML-Dateiname säubern
            */
            const startPage =
                info.htmlFile
                    .replace(/\\/g, "/")
                    .replace(/"/g, "");

            /*
              SFX-Konfiguration
              
              Die HTML-Datei wird nach
              %TEMP% entpackt und geöffnet.
            */
            const config =
`;!@Install@!UTF-8!
Title="Web HTML App"
RunProgram="cmd.exe /c start "" "%TEMP%\\\\WebApp_${id}\\\\${startPage}""
GUIMode="2"
;!@InstallEnd@!`;

            /*
              EXE
            */
            const output =
                path.join(
                    workDir,
                    "WebApp.exe"
                );

            console.log(
                "Erstelle EXE..."
            );

            await createExe(
                sfx,
                archive,
                config,
                output
            );

            /*
              Prüfen
            */
            if (
                !fs.existsSync(output)
            ) {

                throw new Error(
                    "Die EXE wurde nicht erzeugt."
                );
            }

            const stat =
                fs.statSync(output);

            if (
                stat.size <= 0
            ) {

                throw new Error(
                    "Die erzeugte EXE ist leer."
                );
            }

            /*
              Download-ID
            */
            const downloadId =
                crypto
                    .randomBytes(24)
                    .toString("hex");

            generatedFiles.set(
                downloadId,
                {
                    path: output,
                    dir: workDir,
                    created: Date.now()
                }
            );

            console.log(
                "EXE erfolgreich erstellt:",
                stat.size,
                "Bytes"
            );

            /*
              WICHTIG:
              Immer JSON zurückgeben
            */
            return sendJSON(
                res,
                200,
                {
                    ok: true,
                    message:
                        "EXE erfolgreich erstellt.",
                    filename:
                        "WebApp.exe",
                    size:
                        stat.size,
                    download:
                        "/api/download/" +
                        downloadId
                }
            );

        } catch (error) {

            console.error(
                "BUILD ERROR:",
                error
            );

            /*
              Arbeitsordner löschen
            */
            if (workDir) {

                try {

                    fs.rmSync(
                        workDir,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                } catch (cleanupError) {

                    console.error(
                        "Cleanup error:",
                        cleanupError
                    );
                }
            }

            /*
              Niemals leere Antwort
            */
            return sendJSON(
                res,
                500,
                {
                    ok: false,
                    error:
                        error.message ||
                        "Unbekannter Serverfehler."
                }
            );
        }
    }
);

/*
  EXE herunterladen
*/
app.get(
    "/api/download/:id",
    (req, res) => {

        const item =
            generatedFiles.get(
                req.params.id
            );

        if (!item) {

            return res
                .status(404)
                .send(
                    "Datei nicht gefunden oder bereits gelöscht."
                );
        }

        if (
            !fs.existsSync(item.path)
        ) {

            generatedFiles.delete(
                req.params.id
            );

            return res
                .status(404)
                .send(
                    "EXE-Datei nicht gefunden."
                );
        }

        res.download(
            item.path,
            "WebApp.exe",
            (error) => {

                if (error) {

                    console.error(
                        "Download error:",
                        error
                    );

                    return;
                }

                /*
                  Nach Download löschen
                */
                setTimeout(
                    () => {

                        try {

                            fs.rmSync(
                                item.dir,
                                {
                                    recursive: true,
                                    force: true
                                }
                            );

                        } catch (error) {

                            console.error(
                                "Delete error:",
                                error
                            );
                        }

                        generatedFiles.delete(
                            req.params.id
                        );

                    },
                    1000
                );
            }
        );
    }
);

/*
  Multer-Fehler
*/
app.use(
    (error, req, res, next) => {

        console.error(
            "UPLOAD ERROR:",
            error
        );

        if (
            error instanceof
            multer.MulterError
        ) {

            let message =
                error.message;

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                message =
                    "Die ZIP-Datei ist zu groß. " +
                    "Maximal 100 MB sind erlaubt.";
            }

            return sendJSON(
                res,
                400,
                {
                    ok: false,
                    error:
                        "Upload-Fehler: " +
                        message
                }
            );
        }

        return sendJSON(
            res,
            500,
            {
                ok: false,
                error:
                    error.message ||
                    "Serverfehler."
            }
        );
    }
);

/*
  API 404
*/
app.use(
    (req, res) => {

        if (
            req.path.startsWith("/api/")
        ) {

            return sendJSON(
                res,
                404,
                {
                    ok: false,
                    error:
                        "API-Endpunkt nicht gefunden."
                }
            );
        }

        res
            .status(404)
            .send(
                "Nicht gefunden."
            );
    }
);

/*
  Alte Dateien automatisch löschen
*/
setInterval(
    () => {

        const now =
            Date.now();

        for (
            const [
                id,
                item
            ] of generatedFiles
        ) {

            /*
              Nach 30 Minuten löschen
            */
            if (
                now - item.created >
                30 * 60 * 1000
            ) {

                try {

                    fs.rmSync(
                        item.dir,
                        {
                            recursive: true,
                            force: true
                        }
                    );

                } catch (error) {

                    console.error(
                        "Cleanup error:",
                        error
                    );
                }

                generatedFiles.delete(
                    id
                );
            }
        }

    },
    5 * 60 * 1000
);

/*
  Server starten
*/
app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================"
        );

        console.log(
            "ZIP → EXE Server gestartet"
        );

        console.log(
            "Port:",
            PORT
        );

        console.log(
            "ZIP-Limit: 100 MB"
        );

        console.log(
            "Entpackt-Limit: 250 MB"
        );

        console.log(
            "================================"
        );
    }
);
