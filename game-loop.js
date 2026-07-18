// game-loop.js

/**
 * GameLoop
 * ----------
 * - requestAnimationFrame
 * - Fixed Update: 50 Hz
 * - Variable Render
 * - deltaTime in Sekunden
 * - FPS-Zähler
 */

export class GameLoop {
    /**
     * @param {Function} onFixedUpdate (fixedDeltaTime)
     * @param {Function} onRender (deltaTime, alpha)
     */
    constructor(onFixedUpdate = () => {}, onRender = () => {}) {
        this.onFixedUpdate = onFixedUpdate;
        this.onRender = onRender;

        // 50 Hz = 20 ms
        this.fixedTimeStep = 1 / 50;

        this.running = false;

        this.lastTime = 0;
        this.accumulator = 0;

        this.deltaTime = 0;

        // FPS
        this.fps = 0;
        this._frames = 0;
        this._fpsTimer = 0;

        this._loop = this._loop.bind(this);
    }

    /**
     * Startet die Spielschleife.
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.lastTime = performance.now();

        requestAnimationFrame(this._loop);
    }

    /**
     * Stoppt die Spielschleife.
     */
    stop() {
        this.running = false;
    }

    /**
     * Hauptschleife.
     * @param {DOMHighResTimeStamp} now
     * @private
     */
    _loop(now) {
        if (!this.running) return;

        // Sekunden berechnen
        this.deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Verhindert riesige Sprünge nach Tabwechsel
        if (this.deltaTime > 0.25) {
            this.deltaTime = 0.25;
        }

        this.accumulator += this.deltaTime;

        // Fixed Update (50 Hz)
        while (this.accumulator >= this.fixedTimeStep) {
            this.onFixedUpdate(this.fixedTimeStep);
            this.accumulator -= this.fixedTimeStep;
        }

        // Interpolationsfaktor
        const alpha = this.accumulator / this.fixedTimeStep;

        // Render
        this.onRender(this.deltaTime, alpha);

        // FPS berechnen
        this._frames++;
        this._fpsTimer += this.deltaTime;

        if (this._fpsTimer >= 1.0) {
            this.fps = this._frames;

            this._frames = 0;
            this._fpsTimer -= 1.0;
        }

        requestAnimationFrame(this._loop);
    }

    /**
     * Aktuelle FPS.
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Aktuelle Delta-Zeit in Sekunden.
     * @returns {number}
     */
    getDeltaTime() {
        return this.deltaTime;
    }

    /**
     * Ändert den Fixed-Update-Takt.
     * Beispiel:
     * setFixedRate(60) => 60 Hz
     *
     * @param {number} hz
     */
    setFixedRate(hz) {
        if (hz <= 0) {
            throw new Error("Die Frequenz muss größer als 0 sein.");
        }

        this.fixedTimeStep = 1 / hz;
    }
}
