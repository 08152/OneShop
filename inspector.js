// inspector.js

/**
 * Inspector
 * ----------
 * Verbindet die Eingabefelder aus der index.html mit einer
 * Transform-Komponente. Änderungen in den Eingabefeldern werden
 * sofort auf die Komponente übertragen.
 */
export class Inspector {
    constructor() {
        // Eingabefelder aus der index.html
        this.posXInput = document.getElementById("posX");
        this.posYInput = document.getElementById("posY");
        this.widthInput = document.getElementById("scaleW");
        this.heightInput = document.getElementById("scaleH");

        if (
            !this.posXInput ||
            !this.posYInput ||
            !this.widthInput ||
            !this.heightInput
        ) {
            throw new Error("Inspector: Eingabefelder wurden nicht gefunden.");
        }

        this.selectedEntity = null;
        this.selectedTransform = null;

        this._bindEvents();
    }

    /**
     * Registriert die Input-Listener.
     * Änderungen werden direkt in die Transform-Komponente übernommen.
     * @private
     */
    _bindEvents() {
        this.posXInput.addEventListener("input", () => {
            if (!this.selectedTransform) return;
            this.selectedTransform.x = Number(this.posXInput.value);
        });

        this.posYInput.addEventListener("input", () => {
            if (!this.selectedTransform) return;
            this.selectedTransform.y = Number(this.posYInput.value);
        });

        this.widthInput.addEventListener("input", () => {
            if (!this.selectedTransform) return;
            this.selectedTransform.width = Number(this.widthInput.value);
        });

        this.heightInput.addEventListener("input", () => {
            if (!this.selectedTransform) return;
            this.selectedTransform.height = Number(this.heightInput.value);
        });
    }

    /**
     * Wählt eine Entity aus und zeigt ihre Transform-Werte an.
     *
     * @param {number} entityId
     * @param {Object} transformComponent
     */
    selectEntity(entityId, transformComponent) {
        this.selectedEntity = entityId;
        this.selectedTransform = transformComponent;

        if (!transformComponent) {
            this.clear();
            return;
        }

        this.posXInput.value = transformComponent.x;
        this.posYInput.value = transformComponent.y;
        this.widthInput.value = transformComponent.width;
        this.heightInput.value = transformComponent.height;
    }

    /**
     * Leert den Inspector.
     */
    clear() {
        this.selectedEntity = null;
        this.selectedTransform = null;

        this.posXInput.value = "";
        this.posYInput.value = "";
        this.widthInput.value = "";
        this.heightInput.value = "";
    }

    /**
     * Gibt die aktuell ausgewählte Entity zurück.
     *
     * @returns {number|null}
     */
    getSelectedEntity() {
        return this.selectedEntity;
    }
}
