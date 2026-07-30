import os
import glob
import math
import random
from flask import Flask, request, send_file, render_template

# template_folder="." zwingt Flask, die HTML-Datei im selben Ordner zu suchen
app = Flask(__name__, template_folder=".")
IMG_SIZE = 128

def analysiere_und_rendere_pixel(prompt):
    """Analysiert vorhandene Pixel im Ordner und rendert ein neues Bild."""
    neues_bild = Image.new("RGB", (IMG_SIZE, IMG_SIZE), (25, 25, 35))
    neue_pixel = neues_bild.load()

    # Alle Bilder im aktuellen Ordner suchen
    lokale_bilder = []
    for ext in ("*.png", "*.jpg", "*.jpeg"):
        lokale_bilder.extend(glob.glob(ext))

    gelernten_farben = []
    if lokale_bilder:
        try:
            # Zufälliges Bild laden und dessen Pixel analysieren
            zufalls_bild = Image.open(random.choice(lokale_bilder)).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
            alt_pixel = zufalls_bild.load()
            for y in range(0, IMG_SIZE, 4):
                for x in range(0, IMG_SIZE, 4):
                    gelernten_farben.append(alt_pixel[x, y])
        except Exception:
            pass

    if not gelernten_farben:
        gelernten_farben = [(200, 200, 200), (100, 100, 100)]

    # Jeden einzelnen Pixel berechnen
    for y in range(IMG_SIZE):
        for x in range(IMG_SIZE):
            zentrum_x, zentrum_y = IMG_SIZE // 2, IMG_SIZE // 2
            abstand = math.sqrt((x - zentrum_x)**2 + (y - zentrum_y)**2)
            
            basis_farbe = random.choice(gelernten_farben)
            r, g, b = basis_farbe

            # Pixel-Zuordnung basierend auf der Beschreibung
            if "kreis" in prompt.lower() and abstand < 40:
                r, g, b = 255, 60, 60
            elif "wiese" in prompt.lower() and y > (IMG_SIZE * 0.7):
                r, g, b = 50, 200, 70
            elif "sonne" in prompt.lower() and abstand < 20:
                r, g, b = 255, 230, 0
            elif "wellen" in prompt.lower():
                welle = zentrum_y + int(math.sin(x * 0.1) * 15)
                if y > welle:
                    r, g, b = 40, 100, 250

            # Kreativ-Rauschen einrechnen
            rauschen = random.randint(-15, 15)
            r = max(0, min(255, r + rauschen))
            g = max(0, min(255, g + rauschen))
            b = max(0, min(255, b + rauschen))

            neue_pixel[x, y] = (r, g, b)

    output_pfad = "ki_output.png"
    neues_bild.save(output_pfad)
    return output_pfad

@app.route("/", methods=["GET", "POST"])
def home():
    generated = False
    prompt = ""
    if request.method == "POST":
        prompt = request.form.get("prompt", "")
        if prompt:
            global Image
            from PIL import Image
            analysiere_und_rendere_pixel(prompt)
            generated = True
            
    # Lädt index.html direkt aus dem Hauptordner
    return render_template("index.html", generated=generated, prompt=prompt, cache_buster=random.randint(1, 99999))

@app.route("/render_image")
def render_image():
    return send_file("ki_output.png", mimetype="image/png")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
