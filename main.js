// main.js

import { World } from "./ecs.js";
import { GameLoop } from "./game-loop.js";
import { Transform } from "./transform.js";
import { Renderer } from "./renderer.js";
import { InputManager } from "./input-manager.js";
import { Inspector } from "./inspector.js";


/**
 * Hauptinitialisierung der Engine
 */
function main() {

    // ECS Welt erstellen
    const world = new World();


    // Canvas holen
    const canvas = document.getElementById("gameCanvas");

    if (!canvas) {
        throw new Error("Canvas mit id 'gameCanvas' wurde nicht gefunden.");
    }


    // Systeme initialisieren
    const renderer = new Renderer(canvas);
    const input = new InputManager();
    const inspector = new Inspector();


    // Test Entity erstellen
    const playerEntity = world.createEntity();


    // Transform hinzufügen
    const playerTransform = new Transform(
        100,
        100,
        64,
        64
    );

    world.addComponent(
        playerEntity,
        playerTransform
    );


    // Entity im Inspector anzeigen
    inspector.selectEntity(
        playerEntity,
        playerTransform
    );


    /**
     * Fixed Update
     * Läuft exakt mit 50 Hz
     */
    function fixedUpdate(deltaTime) {

        const speed = 200;

        if (input.isKeyPressed("ArrowLeft")) {
            playerTransform.x -= speed * deltaTime;
        }

        if (input.isKeyPressed("ArrowRight")) {
            playerTransform.x += speed * deltaTime;
        }

        if (input.isKeyPressed("ArrowUp")) {
            playerTransform.y -= speed * deltaTime;
        }

        if (input.isKeyPressed("ArrowDown")) {
            playerTransform.y += speed * deltaTime;
        }
    }


    /**
     * Render Update
     * Läuft mit variabler FPS
     */
    function render(deltaTime) {

        renderer.clear("#181818");

        renderer.drawRect(
            playerTransform,
            "#4ea3ff"
        );
    }


    // GameLoop starten
    const gameLoop = new GameLoop(
        fixedUpdate,
        render
    );

    gameLoop.start();


    // Für Debugging in der Browser-Konsole verfügbar machen
    window.engine = {
        world,
        renderer,
        input,
        inspector,
        gameLoop,
        playerEntity
    };
}


// Warten bis HTML geladen ist
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        main
    );
} else {
    main();
}
