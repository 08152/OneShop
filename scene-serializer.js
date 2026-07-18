// scene-serializer.js

/**
 * SceneSerializer
 * ----------------
 * Speichert und lädt ECS-Szenen mit Transform-Komponenten.
 */

export class SceneSerializer {

    /**
     * Konvertiert alle Entities und Transform-Daten
     * einer World in einen JSON-String.
     *
     * @param {World} world
     * @returns {string}
     */
    static serialize(world) {
        const scene = {
            entities: []
        };

        for (const entityId of world._entities) {
            const transform = world.getComponent(entityId, this._getTransformClass(world));

            const entityData = {
                id: entityId,
                transform: null
            };

            if (transform) {
                entityData.transform = {
                    x: transform.x,
                    y: transform.y,
                    width: transform.width,
                    height: transform.height
                };
            }

            scene.entities.push(entityData);
        }

        return JSON.stringify(scene, null, 2);
    }


    /**
     * Lädt eine Szene aus einem JSON-String
     * und erstellt die Entities neu.
     *
     * @param {string} jsonString
     * @param {World} world
     */
    static deserialize(jsonString, world) {
        const scene = JSON.parse(jsonString);

        if (!scene.entities || !Array.isArray(scene.entities)) {
            throw new Error("Ungültige Szenendatei.");
        }

        // Welt leeren
        world._entities.clear();
        world._componentStores.clear();
        world._nextEntityId = 1;


        const TransformClass = this._getTransformClass(world);

        for (const entityData of scene.entities) {
            const entityId = world.createEntity();

            if (entityData.transform && TransformClass) {
                const transform = new TransformClass(
                    entityData.transform.x,
                    entityData.transform.y,
                    entityData.transform.width,
                    entityData.transform.height
                );

                world.addComponent(entityId, transform);
            }
        }
    }


    /**
     * Sucht die Transform-Klasse aus den gespeicherten Komponenten.
     *
     * Da das ECS die Klassen als Schlüssel benutzt,
     * wird die erste Klasse mit Transform-Eigenschaften gesucht.
     *
     * @param {World} world
     * @returns {Function|null}
     * @private
     */
    static _getTransformClass(world) {
        for (const componentClass of world._componentStores.keys()) {
            const name = componentClass.name;

            if (name === "Transform") {
                return componentClass;
            }
        }

        return null;
    }
}
