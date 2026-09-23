const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "20kb" }));

// index.html direkt aus dem Projektordner ausliefern
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

function safeName(name) {
  return String(name || "Meine Website")
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50) || "Meine-Website";
}

function checkUrl(value) {
  try {
    const u = new URL(value);

    if (u.protocol !== "https:" && u.protocol !== "http:") {
      return false;
    }

    if (u.username || u.password) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

app.post("/api/create", (req, res) => {
  try {
    const name = safeName(req.body.name);
    const url = String(req.body.url || "").trim();

    if (!checkUrl(url)) {
      return res.status(400).json({
        error: "Nur gültige HTTP/HTTPS-Webseiten sind erlaubt."
      });
    }

    const id = crypto.randomBytes(12).toString("hex");

    const buildDir = path.join(
      __dirname,
      "generated",
      id
    );

    fs.mkdirSync(buildDir, {
      recursive: true
    });

    fs.writeFileSync(
      path.join(buildDir, "url.txt"),
      url
    );

    res.json({
      ok: true,
      id,
      name,
      url
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
