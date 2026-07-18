// input-manager.js

/**
 * InputManager
 * ------------
 * Verwaltet Tastatureingaben über das window-Objekt.
 *
 * Beispiel:
 * const input = new InputManager();
 *
 * if (input.isKeyPressed("w")) { ... }
 * if (input.isKeyPressed("ArrowLeft")) { ... }
 */

export class InputManager {
    constructor() {
        /**
         * Speichert den aktuellen Zustand jeder Taste.
         * Map<string, boolean>
         */
        this.keys = new Map();

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
    }

    /**
     * Wird beim Drücken einer Taste aufgerufen.
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyDown(event) {
        this.keys.set(event.key, true);
    }

    /**
     * Wird beim Loslassen einer Taste aufgerufen.
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyUp(event) {
        this.keys.set(event.key, false);
    }

    /**
     * Prüft, ob eine Taste aktuell gedrückt ist.
     *
     * @param {string} key
     * @returns {boolean}
     */
    isKeyPressed(key) {
        return this.keys.get(key) === true;
    }

    /**
     * Prüft, ob eine Taste aktuell nicht gedrückt ist.
     *
     * @param {string} key
     * @returns {boolean}
     */
    isKeyReleased(key) {
        return !this.isKeyPressed(key);
    }

    /**
     * Gibt den Zustand einer Taste zurück.
     *
     * @param {string} key
     * @returns {boolean}
     */
    getKeyState(key) {
        return this.keys.get(key) ?? false;
    }

    /**
     * Löscht alle gespeicherten Tastenzustände.
     */
    clear() {
        this.keys.clear();
    }

    /**
     * Entfernt alle Event-Listener.
     */
    destroy() {
        window.removeEventListener("keydown", this._onKeyDown);
        window.removeEventListener("keyup", this._onKeyUp);
        this.keys.clear();
    }
}
