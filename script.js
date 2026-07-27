const icon = document.getElementById("syntax");
const popup = document.getElementById("popup");
const allowBtn = document.getElementById("allow");
const cancelBtn = document.getElementById("cancel");
const terminal = document.getElementById("terminal");
const canvas = document.getElementById("matrix");
const ctx = canvas.getContext("2d");

let matrixRunning = false;

// Fenstergröße anpassen
function resizeCanvas() {
    canvas.width = terminal.clientWidth;
    canvas.height = terminal.clientHeight;
}

window.addEventListener("resize", resizeCanvas);

// Doppelklick auf die Desktop-Datei
icon.addEventListener("dblclick", () => {
    popup.classList.remove("hidden");
});

// Popup schließen
cancelBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
});

// Popup bestätigen
allowBtn.addEventListener("click", () => {

    popup.classList.add("hidden");

    terminal.classList.remove("hidden");

    resizeCanvas();

    if (!matrixRunning) {
        matrixRunning = true;
        startMatrix();
    }

});

// Matrix-Effekt
function startMatrix() {

    const chars =
        "アイウエオカキクケコサシスセソタチツテト0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*";

    const fontSize = 16;

    let columns = Math.floor(canvas.width / fontSize);

    let drops = [];

    function resetDrops() {
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.floor(Math.random() * canvas.height / fontSize);
        }
    }

    resetDrops();

    window.addEventListener("resize", () => {
        resizeCanvas();
        resetDrops();
    });

    function draw() {

        ctx.fillStyle = "rgba(0,0,0,0.08)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#00ff55";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {

            const text =
                chars[Math.floor(Math.random() * chars.length)];

            ctx.fillText(
                text,
                i * fontSize,
                drops[i] * fontSize
            );

            if (
                drops[i] * fontSize > canvas.height &&
                Math.random() > 0.975
            ) {
                drops[i] = 0;
            }

            drops[i]++;

        }

        requestAnimationFrame(draw);

    }

    draw();

}
