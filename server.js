const express = require("express");
const multer = require("multer");
const AdmZip = require("adm-zip");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 10000;

const ROOT = path.join(__dirname, "work");
const UPLOADS = path.join(ROOT, "uploads");
const BUILDS = path.join(ROOT, "builds");

const MAX_ZIP = 25 * 1024 * 1024;
const MAX_UNPACKED = 100 * 1024 * 1024;
const MAX_FILES = 500;

const ALLOWED = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".ico", ".txt", ".woff", ".woff2", ".ttf", ".otf",
  ".mp3", ".wav", ".ogg", ".mp4", ".webm"
]);

const FORBIDDEN = new Set([
  ".exe", ".msi", ".com", ".scr", ".bat", ".cmd",
  ".ps1", ".psm1", ".vbs", ".vbe", ".jscript",
  ".jar", ".dll", ".so", ".dylib", ".sh", ".bash",
  ".zsh", ".bin"
]);

for (const dir of [UPLOADS, BUILDS]) {
  fs.mkdirSync(dir, { recursive: true });
}

app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  dest: UPLOADS,
  limits: {
    fileSize: MAX_ZIP,
    files: 1
  },
  fileFilter(req, file, cb) {
    if (path.extname(file.originalname).toLowerCase() !== ".zip") {
      return cb(new Error("Nur ZIP-Dateien sind erlaubt."));
    }
    cb(null, true);
  }
});

function safeName(name) {
  return String(name || "")
    .trim()
    .replace(/[^a-zA-Z0-9 _.-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50) || "Meine-App";
}

function dangerousPath(name) {
  if (!name || name.length > 240) return true;
  if (name.includes("\0")) return true;
  if (name.startsWith("/") || name.startsWith("\\")) return true;

  const normalized = name.replace(/\\/g, "/");
  const parts = normalized.split("/");

  if (parts.includes("..")) return true;

  const ext = path.extname(normalized).toLowerCase();

  if (FORBIDDEN.has(ext)) return true;

  if (parts.some(p => p.startsWith("."))) {
    if (![".", ".."].includes(parts[parts.length - 1])) {
      return true;
    }
  }

  return false;
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file);

    stream.on("data", d => hash.update(d));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function validateAndExtract(zipFile, destination) {
  const zip = new AdmZip(zipFile);
  const entries = zip.getEntries();

  if (!entries.length) {
    throw new Error("Die ZIP-Datei ist leer.");
  }

  if (entries.length > MAX_FILES) {
    throw new Error(`Zu viele Dateien. Maximum: ${MAX_FILES}.`);
  }

  let total = 0;
  let htmlFound = false;

  for (const entry of entries) {
    const name = entry.entryName;

    if (dangerousPath(name)) {
      throw new Error(`Unsicherer ZIP-Pfad erkannt: ${name}`);
    }

    if (entry.isDirectory) continue;

    const ext = path.extname(name).toLowerCase();

    if (!ALLOWED.has(ext)) {
      throw new Error(`Nicht erlaubter Dateityp: ${name}`);
    }

    const size = Number(entry.header.size || 0);

    total += size;

    if (total > MAX_UNPACKED) {
      throw new Error("Die entpackte ZIP wäre zu groß.");
    }

    if (ext === ".html" || ext === ".htm") {
      htmlFound = true;
    }
  }

  if (!htmlFound) {
    throw new Error("Die ZIP muss mindestens eine HTML-Datei enthalten.");
  }

  await fsp.mkdir(destination, { recursive: true });

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const target = path.resolve(destination, entry.entryName);
    const root = path.resolve(destination);

    if (!target.startsWith(root + path.sep)) {
      throw new Error("Unsicherer Zielpfad erkannt.");
    }

    await fsp.mkdir(path.dirname(target), { recursive: true });

    const data = entry.getData();

    if (data.length > MAX_UNPACKED) {
      throw new Error("Einzelne Datei ist zu groß.");
    }

    await fsp.writeFile(target, data);
  }

  return {
    files: entries.filter(e => !e.isDirectory).length,
    unpackedBytes: total
  };
}

function createElectronFiles(appDir, appName) {
  const electronMain = `
const { app, BrowserWindow, session } = require("electron");
const path = require("path");

app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  win.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(false);
    }
  );

  win.loadFile(path.join(__dirname, "app", "index.html"));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(false);
    }
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
`;

  const packageJson = {
    name: appName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    version: "1.0.0",
    description: appName,
    main: "main.js",
    private: true,
    scripts: {
      dist: "electron-builder --win msi"
    },
    devDependencies: {
      electron: "38.2.0",
      "electron-builder": "26.0.12"
    },
    build: {
      appId: `com.safehtml.${crypto.randomBytes(6).toString("hex")}`,
      productName: appName,
      directories: {
        output: "dist"
      },
      files: [
        "main.js",
        "app/**/*"
      ],
      win: {
        target: [
          {
            target: "msi",
            arch: ["x64"]
          }
        ]
      },
      nsis: {
        oneClick: false
      }
    }
  };

  fs.writeFileSync(
    path.join(appDir, "main.js"),
    electronMain
  );

  fs.writeFileSync(
    path.join(appDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: {
        ...process.env,
        npm_config_audit: "false",
        npm_config_fund: "false"
      }
    });

    let output = "";

    child.stdout.on("data", d => {
      output += d.toString();
    });

    child.stderr.on("data", d => {
      output += d.toString();
    });

    child.on("error", reject);

    child.on("close", code => {
      if (code === 0) resolve(output);
      else reject(new Error(output.slice(-6000)));
    });
  });
}

app.post("/api/build", upload.single("zip"), async (req, res) => {
  let jobDir = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Keine ZIP-Datei hochgeladen."
      });
    }

    const appName = safeName(req.body.name);

    const id = crypto.randomBytes(12).toString("hex");

    jobDir = path.join(BUILDS, id);

    const appDir = path.join(jobDir, "app");

    await fsp.mkdir(appDir, { recursive: true });

    const hash = await sha256(req.file.path);

    const result = await validateAndExtract(
      req.file.path,
      appDir
    );

    const htmlFiles = [];

    async function findHtml(dir) {
      const items = await fsp.readdir(dir, {
        withFileTypes: true
      });

      for (const item of items) {
        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
          await findHtml(full);
        } else if (
          [".html", ".htm"].includes(
            path.extname(item.name).toLowerCase()
          )
        ) {
          htmlFiles.push(full);
        }
      }
    }

    await findHtml(appDir);

    if (!htmlFiles.length) {
      throw new Error("Keine HTML-Datei gefunden.");
    }

    const rootIndex = path.join(appDir, "index.html");

    if (!fs.existsSync(rootIndex)) {
      await fsp.copyFile(
        htmlFiles[0],
        rootIndex
      );
    }

    createElectronFiles(jobDir, appName);

    await fsp.writeFile(
      path.join(jobDir, "security-report.json"),
      JSON.stringify({
        sha256: hash,
        zipSize: req.file.size,
        unpackedBytes: result.unpackedBytes,
        files: result.files,
        checks: {
          pathTraversal: "passed",
          forbiddenExtensions: "passed",
          maxFiles: "passed",
          maxUnpackedSize: "passed",
          nodeIntegration: "disabled",
          contextIsolation: "enabled",
          sandbox: "enabled",
          permissions: "denied"
        }
      }, null, 2)
    );

    /*
      WICHTIG:
      Dieser Server ist für Render vorbereitet.
      Ein MSI-Build funktioniert nur auf einem Windows-
      Build-Runner. Auf Linux/Render wird hier bewusst
      NICHT versucht, beliebige Windows-Programme
      auszuführen.
    */

    if (process.platform !== "win32") {
      return res.status(501).json({
        error:
          "Der sichere ZIP-Check war erfolgreich, aber Render läuft nicht auf Windows. " +
          "Für die MSI-Erstellung muss der Build über einen Windows-Runner, z.B. GitHub Actions, laufen.",
        security: {
          sha256: hash,
          files: result.files,
          unpackedBytes: result.unpackedBytes
        }
      });
    }

    await run("npm", ["install", "--ignore-scripts"], jobDir);

    await run("npx", ["electron-builder", "--win", "msi"], jobDir);

    const dist = path.join(jobDir, "dist");

    const files = await fsp.readdir(dist);

    const msi = files.find(
      f => f.toLowerCase().endsWith(".msi")
    );

    if (!msi) {
      throw new Error("Keine MSI erzeugt.");
    }

    const finalFile = path.join(dist, msi);

    res.download(finalFile, `${appName}.msi`, async () => {
      await fsp.rm(jobDir, {
        recursive: true,
        force: true
      });

      await fsp.rm(req.file.path, {
        force: true
      });
    });

  } catch (err) {
    if (jobDir) {
      await fsp.rm(jobDir, {
        recursive: true,
        force: true
      }).catch(() => {});
    }

    if (req.file?.path) {
      await fsp.rm(req.file.path, {
        force: true
      }).catch(() => {});
    }

    res.status(400).json({
      error: err.message || "Build fehlgeschlagen."
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    platform: process.platform,
    msiBuild:
      process.platform === "win32"
        ? "available"
        : "requires Windows runner"
  });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
