import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());


// Alle Dateien aus dem Projektordner bereitstellen
app.use(express.static(__dirname));


// Hauptseite
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


// Server starten
app.listen(PORT, () => {
    console.log(
        `Game Engine läuft auf http://localhost:${PORT}`
    );
});
