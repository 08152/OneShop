// collider-2d.js

/**
 * Collider2D-Komponente
 * ---------------------
 * Einfache Kollisionskomponente für axis-aligned Bounding Boxes (AABB).
 */
export class Collider2D {
    /**
     * @param {boolean} isTrigger Wenn true, dient der Collider nur zur Erkennung und blockiert nicht.
     * @param {boolean} enabled Ob der Collider aktiv ist.
     */
    constructor(isTrigger = false, enabled = true) {
        this.isTrigger = isTrigger;
        this.enabled = enabled;
    }
}

/**
 * CollisionSystem
 * ----------------
 * Stellt Methoden zur AABB-Kollisionsprüfung bereit.
 */
export class CollisionSystem {
    /**
     * Prüft, ob sich zwei Rechtecke überschneiden.
     *
     * Erwartet zwei Transform-Objekte mit:
     * - x
     * - y
     * - width
     * - height
     *
     * @param {Object} transformA
     * @param {Object} transformB
     * @returns {boolean}
     */
    checkAABB(transformA, transformB) {
        if (!transformA || !transformB) {
            return false;
        }

        return (
            transformA.x < transformB.x + transformB.width &&
            transformA.x + transformA.width > transformB.x &&
            transformA.y < transformB.y + transformB.height &&
            transformA.y + transformA.height > transformB.y
        );
    }

    /**
     * Prüft zusätzlich die Collider-Komponenten.
     *
     * @param {Object} transformA
     * @param {Collider2D} colliderA
     * @param {Object} transformB
     * @param {Collider2D} colliderB
     * @returns {boolean}
     */
    checkCollision(transformA, colliderA, transformB, colliderB) {
        if (!colliderA || !colliderB) {
            return false;
        }

        if (!colliderA.enabled || !colliderB.enabled) {
            return false;
        }

        return this.checkAABB(transformA, transformB);
    }
}
