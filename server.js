const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;


// Dateien aus dem gleichen Ordner laden
app.use(express.static(__dirname));


// Upload Ordner
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}


// Upload Einstellungen
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 500 * 1024 * 1024 // 500 MB
    }
});



// AVI zu MP4
app.post("/convert", upload.single("video"), (req, res) => {

    console.log("Upload gestartet");


    if (!req.file) {

        return res.status(400)
        .send("Keine Datei erhalten.");

    }


    console.log(
        "Datei:",
        req.file.originalname
    );


    const input =
    req.file.path;


    const output =
    path.join(
        "uploads",
        req.file.filename + ".mp4"
    );



    console.log("Starte FFmpeg...");



    ffmpeg(input)

    .output(output)

    .videoCodec("libx264")

    .audioCodec("aac")

    .outputOptions([
        "-preset ultrafast",
        "-pix_fmt yuv420p",
        "-movflags +faststart"
    ])


    .on("start", (cmd) => {

        console.log(
            "FFmpeg Befehl:"
        );

        console.log(cmd);

    })


    .on("progress", (progress) => {

        console.log(
            "Fortschritt:",
            progress.percent || 0,
            "%"
        );

    })


    .on("end", () => {


        console.log(
            "Konvertierung fertig!"
        );


        res.download(
            output,
            "video.mp4",
            () => {


                fs.unlink(
                    input,
                    () => {}
                );


                fs.unlink(
                    output,
                    () => {}
                );


            }
        );


    })


    .on("error", (err) => {


        console.log(
            "FFmpeg Fehler:"
        );


        console.log(err);



        if(fs.existsSync(input)){
            fs.unlinkSync(input);
        }


        if(fs.existsSync(output)){
            fs.unlinkSync(output);
        }


        res.status(500)
        .send(
            "FFmpeg Fehler: "
            + err.message
        );


    })


    .run();


});




// Startseite
app.get("/", (req,res)=>{

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );

});




// Server starten
app.listen(PORT, ()=>{

    console.log(
        "Server läuft auf Port "
        + PORT
    );

});
