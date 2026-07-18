// ecs.js
// Minimalistisches, performantes Entity Component System
// Keine externen Abhängigkeiten

"use strict";

/**
 * Entity IDs sind einfache Zahlen
 */
let nextEntityId = 1;


/**
 * ECS World
 * Verwaltet Entities, Komponenten und Systeme
 */
class World {

    constructor() {
        // Entity -> Map(ComponentType -> ComponentInstance)
        this.components = new Map();

        // Alle Systeme
        this.systems = [];
    }


    /**
     * Erstellt eine neue Entity
     * @returns {number} Entity ID
     */
    createEntity() {
        const id = nextEntityId++;

        this.components.set(id, new Map());

        return id;
    }


    /**
     * Fügt einer Entity eine Komponente hinzu
     * @param {number} entityId
     * @param {object} componentInstance
     */
    addComponent(entityId, componentInstance) {

        const entityComponents = this.components.get(entityId);

        if (!entityComponents) {
            throw new Error("Entity existiert nicht: " + entityId);
        }


        const componentClass = componentInstance.constructor;

        entityComponents.set(componentClass, componentInstance);
    }


    /**
     * Holt eine Komponente einer Entity
     * @param {number} entityId
     * @param {class} componentClass
     * @returns {object|null}
     */
    getComponent(entityId, componentClass) {

        const entityComponents = this.components.get(entityId);

        if (!entityComponents) {
            return null;
        }


        return entityComponents.get(componentClass) || null;
    }


    /**
     * Entfernt eine Entity
     */
    destroyEntity(entityId) {
        this.components.delete(entityId);
    }


    /**
     * Fügt ein System hinzu
     */
    addSystem(system) {
        this.systems.push(system);
        system.world = this;
    }


    /**
     * Aktualisiert alle Systeme
     */
    update(dt) {

        for (let i = 0; i < this.systems.length; i++) {
            this.systems[i].update(dt);
        }

    }


    /**
     * Gibt alle Entities zurück
     */
    getEntities() {
        return this.components.keys();
    }
}


/**
 * Basisklasse für Systeme
 */
class System {

    constructor() {
        this.world = null;
    }


    /**
     * Wird jeden Frame aufgerufen
     * @param {number} dt Zeit seit letztem Frame
     */
    update(dt) {

    }

}



/*
=================================================
Beispiel-Komponenten
=================================================
*/


class Position {

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

}


class Velocity {

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

}



/*
=================================================
Beispiel-System
=================================================
*/

class MovementSystem extends System {


    update(dt) {

        for (const entity of this.world.getEntities()) {

            const position =
                this.world.getComponent(entity, Position);

            const velocity =
                this.world.getComponent(entity, Velocity);


            if (position && velocity) {

                position.x += velocity.x * dt;
                position.y += velocity.y * dt;

            }

        }

    }

}



/*
=================================================
Export für Browser + Node.js
=================================================
*/

if (typeof module !== "undefined" && module.exports) {

    module.exports = {
        World,
        System,
        Position,
        Velocity,
        MovementSystem
    };

}
