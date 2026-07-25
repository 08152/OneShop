const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

// Upload-Ordner erstellen
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// HTML-Datei aus demselben Ordner ausliefern
app.use(express.static(__dirname));

const upload = multer({
    dest: "uploads/"
});

// Konvertierung
app.post("/convert", upload.single("video"), (req, res) => {

    if (!req.file) {
        return res.status(400).send("Keine Datei hochgeladen.");
    }

    const inputFile = req.file.path;
    const outputFile = path.join("uploads", req.file.filename + ".mp4");

    ffmpeg(inputFile)
        .outputOptions([
            "-c:v libx264",
            "-preset ultrafast",
            "-pix_fmt yuv420p",
            "-c:a aac"
        ])
        .toFormat("mp4")
        .save(outputFile)

        .on("end", () => {

            res.download(outputFile, "video.mp4", () => {
                fs.unlink(inputFile, () => {});
                fs.unlink(outputFile, () => {});
            });

        })

        .on("error", (err) => {

            console.error(err);

            fs.unlink(inputFile, () => {});

            if (fs.existsSync(outputFile))
                fs.unlinkSync(outputFile);

            res.status(500).send("Konvertierung fehlgeschlagen.");
        });

});

// Startseite
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
