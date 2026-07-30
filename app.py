import os
import random
import math
from flask import Flask, render_template, request, send_file
from PIL import Image, ImageDraw

app = Flask(__name__)

# Bilddimensionen für das Rendering festgelegt
IMG_WIDTH = 120
IMG_HEIGHT = 120

def KI_pixel_renderer(prompt):
    """
    Analysiert mathematisch jeden einzelnen Pixel (X, Y) 
    und ordnet die Farbwerte der Beschreibung zu.
    """
    # Neues leeres RGB-Bild erstellen
    img = Image.new("RGB", (IMG_WIDTH, IMG_HEIGHT), (30, 30, 45))
    pixels = img.load() # Lädt die Pixel-Matrix direkt in den Speicher

    # Schleife über absolut jeden Pixel
    for y in range(IMG_HEIGHT):
        for x in range(IMG_WIDTH):
            # Berechne den Abstand zur Mitte für Formen (z.B. Kreise)
            zentrum_x, zentrum_y = IMG_WIDTH // 2, IMG_HEIGHT // 2
            abstand = math.sqrt((x - zentrum_x)**2 + (y - zentrum_y)**2)
            
            # Standardpixel-Farbe auslesen
            r, g, b = pixels[x, y]

            # Pixel-Zuordnung basierend auf der Text-Beschreibung
            if "kreis" in prompt.lower() and abstand < 30:
                r, g, b = 240, 50, 50   # Färbe diesen Pixel Rot
            elif "wiese" in prompt.lower() and y > 80:
                r, g, b = 40, 180, 40   # Färbe diesen Pixel Grün
            elif "sonne" in prompt.lower() and abstand < 15:
                r, g, b = 255, 220, 0   # Färbe diesen Pixel Gelb
            elif "wellen" in prompt.lower():
                # Nutzt eine Sinuswelle, um Pixel wellenförmig Blau zu färben
                if y > (60 + math.sin(x * 0.1) * 10):
                    r, g, b = 50, 120, 240

            # Einzigartiges Pixel-Rauschen hinzufügen (Kreativität der KI)
            rauschen = random.randint(-15, 15)
            r = max(0, min(255, r + rauschen))
            g = max(0, min(255, g + rauschen))
            b = max(0, min(255, b + rauschen))

            # Den modifizierten Pixel zurückschreiben
            pixels[x, y] = (r, g, b)

    # Bild temporär auf dem Render-Server zwischenspeichern
    output_path = "generated_output.png"
    img.save(output_path)
    return output_path

@app.route("/", methods=["GET", "POST"])
def index():
    generated = False
    prompt = ""
    if request.method == "POST":
        prompt = request.form.get("prompt", "")
        if prompt:
            KI_pixel_renderer(prompt)
            generated = True
    return render_template("index.html", generated=generated, prompt=prompt)

@app.route("/image")
def get_image():
    # Sendet das generierte Pixel-Bild direkt an den Browser
    return send_file("generated_output.png", mimetype="image/png")

if __name__ == "__main__":
    # Render benötigt dynamische Ports, die über die Umgebungsvariable übergeben werden
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
