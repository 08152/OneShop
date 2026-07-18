// ecs.js

/**
 * Minimalistisches Entity Component System (ECS)
 * ES-Modul
 */

export class World {
    constructor() {
        this._nextEntityId = 1;

        // Map<ComponentClass, Map<EntityId, Component>>
        this._componentStores = new Map();

        // Set<EntityId>
        this._entities = new Set();
    }

    /**
     * Erstellt eine neue Entity.
     * @returns {number}
     */
    createEntity() {
        const id = this._nextEntityId++;
        this._entities.add(id);
        return id;
    }

    /**
     * Fügt einer Entity eine Komponente hinzu.
     * @param {number} entityId
     * @param {object} componentInstance
     * @returns {object}
     */
    addComponent(entityId, componentInstance) {
        if (!this._entities.has(entityId)) {
            throw new Error(`Entity ${entityId} existiert nicht.`);
        }

        const componentClass = componentInstance.constructor;

        let store = this._componentStores.get(componentClass);

        if (!store) {
            store = new Map();
            this._componentStores.set(componentClass, store);
        }

        store.set(entityId, componentInstance);

        return componentInstance;
    }

    /**
     * Gibt die gewünschte Komponente einer Entity zurück.
     * @param {number} entityId
     * @param {Function} componentClass
     * @returns {object|null}
     */
    getComponent(entityId, componentClass) {
        const store = this._componentStores.get(componentClass);

        if (!store) {
            return null;
        }

        return store.get(entityId) ?? null;
    }

    /**
     * Gibt alle Entities zurück,
     * die sämtliche angegebenen Komponenten besitzen.
     *
     * @param {Function[]} componentsArray
     * @returns {number[]}
     */
    getEntitiesWith(componentsArray) {
        if (!Array.isArray(componentsArray) || componentsArray.length === 0) {
            return [];
        }

        const firstStore = this._componentStores.get(componentsArray[0]);

        if (!firstStore) {
            return [];
        }

        const result = [];

        for (const entityId of firstStore.keys()) {
            let valid = true;

            for (let i = 1; i < componentsArray.length; i++) {
                const store = this._componentStores.get(componentsArray[i]);

                if (!store || !store.has(entityId)) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                result.push(entityId);
            }
        }

        return result;
    }
}
