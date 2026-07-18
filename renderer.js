// renderer.js

/**
 * Renderer
 * ----------
 * Einfacher 2D-Canvas-Renderer.
 */

export class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error("Renderer benötigt ein gültiges HTMLCanvasElement.");
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        if (!this.ctx) {
            throw new Error("2D-Canvas-Kontext konnte nicht erstellt werden.");
        }

        this.resize();

        window.addEventListener("resize", () => this.resize());
    }

    /**
     * Passt die interne Canvas-Auflösung
     * an die tatsächliche Anzeigegröße an.
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = Math.max(1, Math.floor(rect.width));
        this.canvas.height = Math.max(1, Math.floor(rect.height));
    }

    /**
     * Löscht den gesamten Bildschirm.
     *
     * @param {string} color
     */
    clear(color = "#202020") {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    /**
     * Zeichnet ein Rechteck anhand einer Transform-Komponente.
     *
     * @param {Object} transform
     * @param {string} color
     */
    drawRect(transform, color = "#ffffff") {
        if (!transform) return;

        this.ctx.fillStyle = color;

        this.ctx.fillRect(
            transform.x,
            transform.y,
            transform.width,
            transform.height
        );
    }

    /**
     * Zeichnet einen Rahmen.
     *
     * @param {Object} transform
     * @param {string} color
     * @param {number} lineWidth
     */
    drawRectOutline(transform, color = "#ffffff", lineWidth = 1) {
        if (!transform) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;

        this.ctx.strokeRect(
            transform.x,
            transform.y,
            transform.width,
            transform.height
        );
    }

    /**
     * Gibt den Canvas-Kontext zurück.
     *
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }
}
