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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024
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
    Ausführbare / gefährliche Dateitypen ablehnen
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

const generatedFiles = new Map();

/*
    JSON-Hilfsfunktion
*/
function sendJSON(res,status,data){

    if(res.headersSent){
        return;
    }

    res.status(status);

    res.setHeader(
        "Content-Type",
        "application/json; charset=utf-8"
    );

    return res.end(
        JSON.stringify(data)
    );
}

/*
    7-Zip suchen
*/
function find7z(){

    const possible = [

        process.env.SEVEN_ZIP_PATH,

        "/usr/bin/7z",
        "/usr/local/bin/7z",
        "/bin/7z",

        "/usr/bin/7zz",
        "/usr/local/bin/7zz"

    ].filter(Boolean);

    for(const file of possible){

        try{

            if(fs.existsSync(file)){
                return file;
            }

        }catch{}
    }

    return null;
}

/*
    SFX-Modul suchen
*/
function findSFX(){

    const possible = [

        process.env.SFX_PATH,

        "/usr/lib/p7zip/7zS.sfx",
        "/usr/lib/7zip/7zS.sfx",
        "/opt/7zip/7zS.sfx",
        "/usr/local/lib/p7zip/7zS.sfx",

        path.join(__dirname,"7zS.sfx")

    ].filter(Boolean);

    for(const file of possible){

        try{

            if(fs.existsSync(file)){
                return file;
            }

        }catch{}
    }

    return null;
}

/*
    ZIP-Sicherheit prüfen
*/
function validateZip(zip){

    const entries = zip.getEntries();

    if(!entries.length){

        throw new Error(
            "Die ZIP-Datei ist leer."
        );
    }

    if(entries.length > 500){

        throw new Error(
            "Die ZIP-Datei enthält mehr als 500 Dateien."
        );
    }

    let totalSize = 0;
    let htmlFile = null;

    for(const entry of entries){

        const rawName = entry.entryName || "";

        /*
            Pfad normalisieren
        */
        const normalized = rawName
            .replace(/\\/g,"/")
            .replace(/^\/+/,"");

        /*
            Path Traversal verhindern
        */
        if(
            normalized.startsWith("../") ||
            normalized.includes("/../") ||
            normalized === ".." ||
            path.posix.isAbsolute(normalized)
        ){

            throw new Error(
                "Unsicherer Dateipfad in der ZIP: " +
                rawName
            );
        }

        if(entry.isDirectory){
            continue;
        }

        const ext = path.posix.extname(normalized).toLowerCase();

        /*
            Ausführbare Dateien blockieren
        */
        if(blockedExtensions.has(ext)){

            throw new Error(
                "Nicht erlaubte ausführbare Datei gefunden: " +
                rawName
            );
        }

        /*
            Nur erlaubte Web-Dateien
        */
        if(!allowedExtensions.has(ext)){

            throw new Error(
                "Nicht unterstützte Datei gefunden: " +
                rawName
            );
        }

        const size =
            Number(entry.header.compressedSize || 0) +
            Number(entry.header.size || 0);

        totalSize += Number(entry.header.size || 0);

        if(totalSize > 50 * 1024 * 1024){

            throw new Error(
                "Die entpackte ZIP-Größe darf maximal 50 MB betragen."
            );
        }

        if(
            normalized.toLowerCase() === "index.html"
        ){

            htmlFile = normalized;
        }else if(
            !htmlFile &&
            (ext === ".html" || ext === ".htm")
        ){

            htmlFile = normalized;
        }
    }

    if(!htmlFile){

        throw new Error(
            "Keine HTML-Datei gefunden. Die ZIP muss mindestens eine .html-Datei enthalten."
        );
    }

    return {
        entries,
        htmlFile,
        totalSize
    };
}

/*
    Dateien aus ZIP extrahieren
*/
function extractZip(zip,folder){

    const entries = zip.getEntries();

    for(const entry of entries){

        if(entry.isDirectory){
            continue;
        }

        const relative =
            entry.entryName
                .replace(/\\/g,"/")
                .replace(/^\/+/,"");

        const destination =
            path.resolve(folder,relative);

        const root =
            path.resolve(folder);

        /*
            Zusätzlicher Path-Traversal-Schutz
        */
        if(
            destination !== root &&
            !destination.startsWith(root + path.sep)
        ){

            throw new Error(
                "Unsicherer Dateipfad."
            );
        }

        fs.mkdirSync(
            path.dirname(destination),
            { recursive:true }
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
    7z-Archiv erstellen
*/
function createArchive(sevenZip,folder,archive){

    return new Promise((resolve,reject)=>{

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
                cwd:folder,
                timeout:120000,
                maxBuffer:5 * 1024 * 1024
            },
            (error,stdout,stderr)=>{

                if(error){

                    reject(
                        new Error(
                            "7-Zip konnte das Archiv nicht erstellen.\n" +
                            (stderr || error.message)
                        )
                    );

                    return;
                }

                resolve();
            }
        );
    });
}

/*
    EXE bauen
*/
function createExe(sfx,archive,config,output){

    return new Promise((resolve,reject)=>{

        try{

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

        }catch(error){

            reject(error);
        }
    });
}

/*
    Build-Endpunkt
*/
app.post(
    "/api/build",
    upload.single("zip"),
    async(req,res)=>{

        let workDir = null;

        try{

            if(!req.file){

                return sendJSON(
                    res,
                    400,
                    {
                        ok:false,
                        error:"Keine ZIP-Datei hochgeladen."
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
                ZIP laden
            */
            let zip;

            try{

                zip =
                    new AdmZip(req.file.buffer);

            }catch(error){

                return sendJSON(
                    res,
                    400,
                    {
                        ok:false,
                        error:"Die ZIP-Datei konnte nicht gelesen werden."
                    }
                );
            }

            /*
                ZIP prüfen
            */
            const info =
                validateZip(zip);

            console.log(
                "ZIP geprüft:",
                info.entries.length,
                "Dateien"
            );

            /*
                Tools suchen
            */
            const sevenZip =
                find7z();

            if(!sevenZip){

                return sendJSON(
                    res,
                    500,
                    {
                        ok:false,
                        error:
                            "7-Zip wurde auf dem Render-Server nicht gefunden."
                    }
                );
            }

            const sfx =
                findSFX();

            if(!sfx){

                return sendJSON(
                    res,
                    500,
                    {
                        ok:false,
                        error:
                            "Das 7-Zip-SFX-Modul (7zS.sfx) wurde nicht gefunden."
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
                Arbeitsordner
            */
            const id =
                crypto
                    .randomBytes(12)
                    .toString("hex");

            workDir =
                path.join(
                    os.tmpdir(),
                    "zip-exe-" + id
                );

            fs.mkdirSync(
                workDir,
                {
                    recursive:true
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
                    recursive:true
                }
            );

            /*
                ZIP entpacken
            */
            extractZip(
                zip,
                filesDir
            );

            /*
                Archiv erstellen
            */
            const archive =
                path.join(
                    workDir,
                    "app.7z"
                );

            await createArchive(
                sevenZip,
                filesDir,
                archive
            );

            /*
                HTML-Datei sicher in SFX-Konfiguration
                einsetzen
            */
            const startPage =
                info.htmlFile
                    .replace(/\\/g,"/")
                    .replace(/"/g,"");

            /*
                SFX-Konfiguration
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

            await createExe(
                sfx,
                archive,
                config,
                output
            );

            /*
                Prüfen, ob EXE tatsächlich existiert
            */
            if(
                !fs.existsSync(output)
            ){

                throw new Error(
                    "Die EXE wurde nicht erzeugt."
                );
            }

            const stat =
                fs.statSync(output);

            if(stat.size <= 0){

                throw new Error(
                    "Die erzeugte EXE ist leer."
                );
            }

            /*
                Download-ID
            */
            const downloadId =
                crypto
                    .randomBytes(18)
                    .toString("hex");

            generatedFiles.set(
                downloadId,
                {
                    path:output,
                    dir:workDir,
                    created:Date.now()
                }
            );

            console.log(
                "EXE erstellt:",
                output,
                stat.size,
                "Bytes"
            );

            return sendJSON(
                res,
                200,
                {
                    ok:true,
                    message:"EXE erfolgreich erstellt.",
                    download:
                        "/api/download/" +
                        downloadId
                }
            );

        }catch(error){

            console.error(
                "BUILD ERROR:",
                error
            );

            /*
                Arbeitsordner löschen
            */
            if(workDir){

                try{

                    fs.rmSync(
                        workDir,
                        {
                            recursive:true,
                            force:true
                        }
                    );

                }catch(cleanError){

                    console.error(
                        "Cleanup error:",
                        cleanError
                    );
                }
            }

            return sendJSON(
                res,
                500,
                {
                    ok:false,
                    error:
                        error.message ||
                        "Unbekannter Serverfehler."
                }
            );
        }
    }
);

/*
    Download
*/
app.get(
    "/api/download/:id",
    (req,res)=>{

        const item =
            generatedFiles.get(
                req.params.id
            );

        if(!item){

            return res
                .status(404)
                .send(
                    "Datei nicht gefunden oder bereits gelöscht."
                );
        }

        if(!fs.existsSync(item.path)){

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
            (error)=>{

                if(error){

                    console.error(
                        "Download error:",
                        error
                    );

                    return;
                }

                /*
                    Nach erfolgreichem Download löschen
                */
                setTimeout(()=>{

                    try{

                        fs.rmSync(
                            item.dir,
                            {
                                recursive:true,
                                force:true
                            }
                        );

                    }catch(error){

                        console.error(
                            "Delete error:",
                            error
                        );
                    }

                    generatedFiles.delete(
                        req.params.id
                    );

                },1000);
            }
        );
    }
);

/*
    Multer-Fehler
*/
app.use(
    (error,req,res,next)=>{

        console.error(
            "EXPRESS ERROR:",
            error
        );

        if(error instanceof multer.MulterError){

            return sendJSON(
                res,
                400,
                {
                    ok:false,
                    error:
                        "Upload-Fehler: " +
                        error.message
                }
            );
        }

        return sendJSON(
            res,
            500,
            {
                ok:false,
                error:
                    error.message ||
                    "Serverfehler."
            }
        );
    }
);

/*
    Nicht gefundene API
*/
app.use(
    (req,res)=>{

        if(req.path.startsWith("/api/")){

            return sendJSON(
                res,
                404,
                {
                    ok:false,
                    error:"API-Endpunkt nicht gefunden."
                }
            );
        }

        res
            .status(404)
            .send("Nicht gefunden.");
    }
);

/*
    Alte Dateien regelmäßig löschen
*/
setInterval(()=>{

    const now =
        Date.now();

    for(
        const [
            id,
            item
        ] of generatedFiles
    ){

        if(
            now - item.created >
            30 * 60 * 1000
        ){

            try{

                fs.rmSync(
                    item.dir,
                    {
                        recursive:true,
                        force:true
                    }
                );

            }catch(error){

                console.error(
                    "Cleanup error:",
                    error
                );
            }

            generatedFiles.delete(id);
        }
    }

},5 * 60 * 1000);

/*
    Server starten
*/
app.listen(
    PORT,
    "0.0.0.0",
    ()=>{
        console.log(
            "Server läuft auf Port",
            PORT
        );
    }
);
