<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meine Render KI</title>
    <style>
        body { font-family: sans-serif; background: #121214; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .box { background: #202024; padding: 30px; border-radius: 10px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
        button { background: #8257e5; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #9466ff; }
        #output { margin-top: 20px; font-weight: bold; color: #04d361; }
    </style>
</head>
<body>
    <div class="box">
        <h1>Mini KI Textvorhersage</h1>
        <p>Eingabe: <strong>"ki "</strong></p>
        <button onclick="fragKI()">Satz vervollständigen</button>
        <div id="output">Klicke auf den Button...</div>
    </div>

    <script>
        async function fragKI() {
            const status = document.getElementById('output');
            status.innerText = 'KI denkt nach...';
            try {
                const response = await fetch('/api/predict?text=ki ');
                const data = await response.json();
                status.innerText = `KI ergänzt: "${data.vorhersage}"`;
            } catch (error) {
                status.innerText = 'Fehler beim Abrufen der KI-Daten.';
            }
        }
    </script>
</body>
</html>
