"use strict";

/**
 * ecs.js
 * Minimalistisches, performantes Entity Component System (ECS)
 * Keine externen Abhängigkeiten.
 */

/* ============================
   EntityManager
============================ */

class EntityManager {
    constructor() {
        this._nextEntityId = 1;

        // Map<ComponentClass, Map<EntityId, Component>>
        this._components = new Map();
    }

    /**
     * Erstellt eine neue Entity.
     * @returns {number}
     */
    createEntity() {
        return this._nextEntityId++;
    }

    /**
     * Fügt einer Entity eine Komponente hinzu.
     * @param {number} entityId
     * @param {object} componentInstance
     */
    addComponent(entityId, componentInstance) {
        if (typeof entityId !== "number") {
            throw new TypeError("entityId muss eine Zahl sein.");
        }

        if (componentInstance == null) {
            throw new TypeError("componentInstance darf nicht null sein.");
        }

        const componentClass = componentInstance.constructor;

        let storage = this._components.get(componentClass);

        if (!storage) {
            storage = new Map();
            this._components.set(componentClass, storage);
        }

        storage.set(entityId, componentInstance);
    }

    /**
     * Gibt eine Komponente zurück.
     * @param {number} entityId
     * @param {Function} componentClass
     * @returns {*|undefined}
     */
    getComponent(entityId, componentClass) {
        const storage = this._components.get(componentClass);

        if (!storage) {
            return undefined;
        }

        return storage.get(entityId);
    }

    /**
     * Entfernt eine Komponente.
     * @param {number} entityId
     * @param {Function} componentClass
     */
    removeComponent(entityId, componentClass) {
        const storage = this._components.get(componentClass);

        if (storage) {
            storage.delete(entityId);

            if (storage.size === 0) {
                this._components.delete(componentClass);
            }
        }
    }

    /**
     * Entfernt alle Komponenten einer Entity.
     * @param {number} entityId
     */
    removeEntity(entityId) {
        for (const storage of this._components.values()) {
            storage.delete(entityId);
        }
    }

    /**
     * Prüft, ob eine Entity eine bestimmte Komponente besitzt.
     * @param {number} entityId
     * @param {Function} componentClass
     * @returns {boolean}
     */
    hasComponent(entityId, componentClass) {
        const storage = this._components.get(componentClass);
        return storage ? storage.has(entityId) : false;
    }

    /**
     * Gibt alle Komponenten eines Typs zurück.
     * @param {Function} componentClass
     * @returns {Map<number, object>}
     */
    getComponentStorage(componentClass) {
        return this._components.get(componentClass) || new Map();
    }

    /**
     * Liefert alle Entities, die alle angegebenen Komponenten besitzen.
     * @param  {...Function} componentClasses
     * @returns {number[]}
     */
    getEntitiesWith(...componentClasses) {
        if (componentClasses.length === 0) {
            return [];
        }

        const firstStorage = this._components.get(componentClasses[0]);

        if (!firstStorage) {
            return [];
        }

        const result = [];

        outer:
        for (const entityId of firstStorage.keys()) {
            for (let i = 1; i < componentClasses.length; i++) {
                const storage = this._components.get(componentClasses[i]);

                if (!storage || !storage.has(entityId)) {
                    continue outer;
                }
            }

            result.push(entityId);
        }

        return result;
    }
}

/* ============================
   Basisklasse für Systeme
============================ */

class System {
    /**
     * @param {EntityManager} ecs
     */
    constructor(ecs) {
        this.ecs = ecs;
    }

    /**
     * Wird pro Frame aufgerufen.
     * @param {number} dt Delta-Time in Sekunden
     */
    update(dt) {
        // Von Unterklassen überschreiben.
    }
}

/* ============================
   Optionaler Export
============================ */

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        EntityManager,
        System
    };
}

if (typeof window !== "undefined") {
    window.EntityManager = EntityManager;
    window.System = System;
}
