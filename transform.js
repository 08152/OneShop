// transform.js

/**
 * Transform-Komponente
 * --------------------
 * Speichert Position und Größe eines 2D-Objekts.
 */

export class Transform {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(x = 0, y = 0, width = 32, height = 32) {
        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;
    }

    /**
     * Setzt die Position.
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Verschiebt die Position relativ.
     * @param {number} dx
     * @param {number} dy
     */
    translate(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    /**
     * Setzt die Größe.
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Gibt eine Kopie der Komponente zurück.
     * @returns {Transform}
     */
    clone() {
        return new Transform(
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
}
