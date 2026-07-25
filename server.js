const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 500 * 1024 * 1024
    }
});


app.post("/convert", upload.single("video"), (req,res)=>{

    console.log("Upload gestartet");

    if(!req.file){
        return res.status(400).send("Keine Datei");
    }

    console.log("Datei erhalten:", req.file.originalname);


    const input = req.file.path;
    const output = input + ".mp4";


    ffmpeg(input)
    .videoCodec("libx264")
    .audioCodec("aac")
    .outputOptions([
        "-preset",
        "ultrafast",
        "-pix_fmt",
        "yuv420p"
    ])
    .on("start",cmd=>{
        console.log("FFmpeg:",cmd);
    })
    .on("progress",p=>{
        console.log("Fortschritt:",p.percent);
    })
    .on("end",()=>{

        console.log("Fertig");

        res.download(output,"video.mp4",()=>{

            fs.unlink(input,()=>{});
            fs.unlink(output,()=>{});

        });

    })
    .on("error",err=>{

        console.log("FFmpeg Fehler:",err);

        res.status(500).send("FFmpeg Fehler");

    })
    .save(output);

});


app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,"index.html"));
});


app.listen(PORT,()=>{
    console.log("Server läuft auf Port "+PORT);
});
