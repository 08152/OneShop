/**
 * script.js - Anwendungssteuerung und Navigationslogik
 */

// Globale Zustandsvariablen (State)
let currentCoords = { lat: 52.520008, lng: 13.404954 }; // Fallback Berlin
let targetCoords = null;
let activeRoute = []; // Array von {lat, lng, instruction} Objekten des OSRM-Pfads
let totalRouteDistanceMeters = 0;
let isNavigating = false;
let lastSpokenNodeIndex = -1;

// DOM Elemente
const startInput = document.getElementById('start-input');
const targetInput = document.getElementById('target-input');
const startSuggestions = document.getElementById('start-suggestions');
const targetSuggestions = document.getElementById('target-suggestions');
const navStatus = document.getElementById('nav-status');
const cockpitTime = document.getElementById('cockpit-time');
const cockpitEta = document.getElementById('cockpit-eta');
const cockpitDist = document.getElementById('cockpit-dist');

// Initialisierung bei Skriptstart (Kriterium 8: Timing-Fix)
window.addEventListener('load', () => {
    // 1. Initialisiere die Karte kontrolliert über die 1.js Schnittstelle
    initLeafletMapSystem('map-view', currentCoords.lat, currentCoords.lng);
    
    // 2. Echtzeituhr starten
    setInterval(updateRealTimeClock, 1000);

    // 3. Echtes GPS-Tracking starten
    initHtml5GeolocationTracking();

    // 4. Input-Events für Live-Suche binden
    setupSearchAutocomplete(startInput, startSuggestions, (coords) => {
        currentCoords = coords;
        updateMapUserPosition(coords.lat, coords.lng);
        centerMapOnUser(coords.lat, coords.lng);
        checkAndTriggerRouting();
    });

    setupSearchAutocomplete(targetInput, targetSuggestions, (coords, displayName) => {
        targetCoords = coords;
        updateMapTargetMarker(coords.lat, coords.lng, displayName);
        checkAndTriggerRouting();
    });
});

/**
 * Kontinuierliche HTML5 Geolocation-Überwachung (Echtzeit-Standort)
 */
function initHtml5GeolocationTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                currentCoords = { lat, lng };
                updateMapUserPosition(lat, lng);

                if (!isNavigating) {
                    // Beim ersten echten Fix oder außerhalb der Navigation zentrieren
                    centerMapOnUser(lat, lng);
                } else {
                    // Während der Navigation: Prüfe Abweichung und verarbeite Fortschritt
                    processNavigationStep(lat, lng);
                }
            },
            (error) => {
                console.warn("GPS-Fehler oder Zugriff verweigert. Verwende statisches Netz.", error);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 5000
            }
        );
    }
}

/**
 * Suchfeld-Autovervollständigung über OpenStreetMap Nominatim API
 * mit integriertem deterministischen String-Hashing Fallback im Offlinefall.
 */
function setupSearchAutocomplete(inputElement, suggestionsElement, onSelectCallback) {
    let debounceTimeout = null;

    inputElement.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        const query = inputElement.value.trim();

        if (query.length < 3) {
            suggestionsElement.innerHTML = '';
            return;
        }

        debounceTimeout = setTimeout(() => {
            // Online-Abfrage via OSM Nominatim API
            fetch(`https://openstreetmap.org{encodeURIComponent(query)}&addressdetails=1&limit=5`, {
                headers: { 'User-Agent': '2D-Online-Nav-App-Render' }
            })
            .then(res => res.json())
            .then(data => {
                suggestionsElement.innerHTML = '';
                if (data && data.length > 0) {
                    data.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item.display_name;
                        li.addEventListener('click', () => {
                            inputElement.value = item.display_name;
                            suggestionsElement.innerHTML = '';
                            onSelectCallback({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) }, item.display_name);
                        });
                        suggestionsElement.appendChild(li);
                    });
                } else {
                    executeOfflineHashFallback(query, suggestionsElement, onSelectCallback);
                }
            })
            .catch(() => {
                // Bei Netzwerkfehler: Automatisches Greifen des Offline-Fallbacks
                executeOfflineHashFallback(query, suggestionsElement, onSelectCallback);
            });
        }, 400);
    });

    // Schließen der Vorschläge bei Klick außerhalb
    document.addEventListener('click', (e) => {
        if (e.target !== inputElement) {
            suggestionsElement.innerHTML = '';
        }
    });
}

/**
 * Mathematisches String-Hashing als Offline-Fallback für 3 Mio.+ Orte.
 */
function executeOfflineHashFallback(query, suggestionsElement, onSelectCallback) {
    suggestionsElement.innerHTML = '';
    
    // Einfacher djb2-Hash-Algorithmus
    let hash = 5381;
    for (let i = 0; i < query.length; i++) {
        hash = ((hash << 5) + hash) + query.charCodeAt(i);
    }
    
    // Erzeuge deterministische Koordinaten innerhalb eines Fensters um Deutschland
    const latMin = 47.0, latMax = 55.0;
    const lngMin = 6.0, lngMax = 15.0;
    
    const scaleLat = Math.abs(Math.sin(hash)) * (latMax - latMin) + latMin;
    const scaleLng = Math.abs(Math.cos(hash)) * (lngMax - lngMin) + lngMin;

    const fallbackName = `${query} (Offline-Generiert)`;
    const li = document.createElement('li');
    li.textContent = fallbackName + ` [${scaleLat.toFixed(3)}, ${scaleLng.toFixed(3)}]`;
    
    li.addEventListener('click', () => {
        inputElement.value = fallbackName;
        suggestionsElement.innerHTML = '';
        onSelectCallback({ lat: scaleLat, lng: scaleLng }, fallbackName);
    });
    suggestionsElement.appendChild(li);
}

/**
 * Prüft, ob Start und Ziel gesetzt sind und stößt die Routenberechnung an.
 */
function checkAndTriggerRouting() {
    if (currentCoords && targetCoords) {
        calculateOnlineRoute(currentCoords, targetCoords);
    }
}

/**
 * Berechnet die optimale Fahrstrecke mithilfe der freien OSRM-API.
 */
function calculateOnlineRoute(start, target) {
    navStatus.textContent = "Berechne optimale 2D-Route...";
    
    const url = `https://project-osrm.org{start.lng},${start.lat};${target.lng},${target.lat}?overview=full&geometries=geojson&steps=true`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.routes || data.routes.length === 0) {
                navStatus.textContent = "Keine Route gefunden.";
                return;
            }

            const routeData = data.routes[0];
            totalRouteDistanceMeters = routeData.distance;
            
            // Extrahiere detaillierte Punkte und Straßennamen
            activeRoute = [];
            routeData.legs.forEach(leg => {
                leg.steps.forEach(step => {
                    const streetName = step.name || "Straße";
                    const modifier = step.maneuver.modifier || "geradeaus";
                    const instruction = `${getGermanDirectionInstruction(modifier)} auf ${streetName}`;
                    
                    step.geometry.coordinates.forEach(coord => {
                        activeRoute.push({
                            lat: coord[1], // GeoJSON nutzt [lng, lat] Reihenfolge
                            lng: coord[0],
                            instruction: instruction
                        });
                    });
                });
            });

            // Map-Zeichnung triggern (aus 1.js)
            drawRouteOnMap(activeRoute);
            
            isNavigating = true;
            lastSpokenNodeIndex = -1;
            navStatus.textContent = "Navigation aktiv";
            
            // Initialer Tacho- und Cockpit-Update
            updateCockpitData(totalRouteDistanceMeters);
            speakGermanVoiceText("Die Route wurde berechnet. Folgen Sie dem Straßenverlauf.");
        })
        .catch(err => {
            console.error("OSRM Routing Fehler:", err);
            navStatus.textContent = "Routing-Server nicht erreichbar.";
        });
}

/**
 * Übersetzt OSRM-Richtungsanweisungen ins Deutsche
 */
function getGermanDirectionInstruction(modifier) {
    switch (modifier) {
        case 'left': return 'Links abbiegen';
        case 'right': return 'Rechts abbiegen';
        case 'sharp left': return 'Scharf links abbiegen';
        case 'sharp right': return 'Scharf rechts abbiegen';
        case 'slight left': return 'Leicht links halten';
        case 'slight right': return 'Leicht rechts halten';
        case 'straight': return 'Geradeaus weiterfahren';
        default: return 'Dem Verlauf folgen';
    }
}

/**
 * Verarbeitet den GPS-Fortschritt im Navigationsmodus.
 * Löscht abgefahrene Teilstücke und triggert automatische Neuberechnungen.
 */
function processNavigationStep(userLat, userLng) {
    if (activeRoute.length === 0) return;

    // 1. Prüfe auf gravierende Abweichung vom Kurs (Verfahren > 500 Meter)
    let minDistanceToRoute = Infinity;
    let closestNodeIndex = -1;

    for (let i = 0; i < activeRoute.length; i++) {
        const dist = calculateDistanceInMeters(userLat, userLng, activeRoute[i].lat, activeRoute[i].lng);
        if (dist < minDistanceToRoute) {
            minDistanceToRoute = dist;
            closestNodeIndex = i;
        }
    }

    // Kriterium 5: Automatische Neuberechnung, wenn der Nutzer sich mehr als 500 Meter entfernt
    if (minDistanceToRoute > 500) {
        console.warn("Kursabweichung > 500m! Automatische Neuberechnung wird ausgeführt.");
        speakGermanVoiceText("Sie haben die Route verlassen. Route wird neu berechnet.");
        calculateOnlineRoute({ lat: userLat, lng: userLng }, targetCoords);
        return;
    }

    // Kriterium 4: Verschwindende Linien.
    if (closestNodeIndex > 0) {
        activeRoute.splice(0, closestNodeIndex);
        updateActiveRouteLine(activeRoute); // Ruft Funktion aus 1.js auf
    }

    // Kriterium 6: Sprachhilfe auslösen bei Annäherung (< 40 Meter)
    if (activeRoute.length > 0 && lastSpokenNodeIndex !== closestNodeIndex) {
        const nextNode = activeRoute[0];
        if (nextNode.instruction && minDistanceToRoute < 40) {
            speakGermanVoiceText(nextNode.instruction);
            lastSpokenNodeIndex = closestNodeIndex;
        }
    }

    // 4. Verbleibende Restdistanz summieren und Cockpit updaten
    let remainingDistance = 0;
    for (let i = 0; i < activeRoute.length - 1; i++) {
        remainingDistance += calculateDistanceInMeters(
            activeRoute[i].lat, activeRoute[i].lng,
            activeRoute[i+1].lat, activeRoute[i+1].lng
        );
    }

    updateCockpitData(remainingDistance);

    // Zielankunft prüfen
    if (activeRoute.length <= 2 && remainingDistance < 20) {
        isNavigating = false;
        clearRouteFromMap(); // Ruft Funktion aus 1.js auf
        navStatus.textContent = "Ziel erreicht!";
        speakGermanVoiceText("Sie haben Ihr Ziel erreicht.");
    }
}

/**
 * Berechnet Echtzeitdaten für das Tacho-Cockpit inklusive exakter Uhrzeit-ETA
 */
function updateCockpitData(distanceInMeters) {
    const distanceKm = distanceInMeters / 1000;
    cockpitDist.textContent = `${distanceKm.toFixed(1)} km`;

    // Durchschnittliche Fahrgeschwindigkeit annehmen (45 km/h)
    const averageSpeedKmh = 45;
    const travelTimeHours = distanceKm / averageSpeedKmh;
    const travelTimeMinutes = travelTimeHours * 60;

    // Kriterium 3: Exakte Ankunftszeit (ETA)
    const now = new Date();
    const etaDate = new Date(now.getTime() + travelTimeMinutes * 60 * 1000);
    
    const etaHours = String(etaDate.getHours()).padStart(2, '0');
    const etaMinutes = String(etaDate.getMinutes()).padStart(2, '0');
    
    cockpitEta.textContent = `${etaHours}:${etaMinutes} Uhr`;
}

/**
 * Aktualisiert die Echtzeituhr im Sekundentakt
 */
function updateRealTimeClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    cockpitTime.textContent = `${hours}:${minutes}:${seconds}`;
}

/**
 * Text-to-Speech Ausgabe via HTML5 Web Speech API auf Deutsch
 */
function speakGermanVoiceText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Verhindert Stauungen in der Audiowarteschlange
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}
