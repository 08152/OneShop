const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
const PORT = process.env.PORT || 3000;

ffmpeg.setFfmpegPath(ffmpegPath);

// index.html liegt im selben Ordner wie server.js
app.use(express.static(__dirname));

const tempFolder = path.join(os.tmpdir(), "video-to-mp3");

if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempFolder);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000000);

        cb(
            null,
            uniqueName + path.extname(file.originalname)
        );
    }
});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 500 * 1024 * 1024
    }
});

app.post(
    "/convert",
    upload.single("video"),

    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                error: "Keine Videodatei ausgewählt."
            });
        }

        const inputFile = req.file.path;

        const outputFile = path.join(
            tempFolder,
            Date.now() + "-" +
            Math.round(Math.random() * 1000000000) +
            ".mp3"
        );

        console.log(
            "Konvertiere:",
            req.file.originalname
        );

        ffmpeg(inputFile)

            .noVideo()

            .audioCodec("libmp3lame")

            .audioBitrate("192k")

            .format("mp3")

            .on("start", command => {

                console.log(
                    "FFmpeg gestartet:"
                );

                console.log(command);

            })

            .on("progress", progress => {

                console.log(
                    "Fortschritt:",
                    progress.percent
                );

            })

            .on("error", error => {

                console.error(
                    "FFmpeg Fehler:",
                    error
                );

                cleanup();

                if (!res.headersSent) {
                    res.status(500).json({
                        error:
                            "Die Konvertierung ist fehlgeschlagen.",
                        details:
                            error.message
                    });
                }

            })

            .on("end", () => {

                console.log(
                    "Konvertierung fertig!"
                );

                const originalName =
                    path.parse(
                        req.file.originalname
                    ).name;

                res.download(
                    outputFile,
                    originalName + ".mp3",

                    error => {

                        if (error) {
                            console.error(
                                "Download Fehler:",
                                error
                            );
                        }

                        cleanup();

                    }
                );

            })

            .save(outputFile);


        function cleanup() {

            try {

                if (
                    fs.existsSync(
                        inputFile
                    )
                ) {
                    fs.unlinkSync(
                        inputFile
                    );
                }

                if (
                    fs.existsSync(
                        outputFile
                    )
                ) {
                    fs.unlinkSync(
                        outputFile
                    );
                }

            } catch (error) {

                console.error(
                    "Löschfehler:",
                    error
                );

            }

        }

    }
);


// Status

app.get("/health", (req, res) => {

    res.json({
        online: true,
        message:
            "Video zu MP3 Konverter läuft!"
    });

});


// Start

app.listen(PORT, () => {

    console.log(
        "Server läuft auf Port " +
        PORT
    );

});
