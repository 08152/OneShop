/**
 * 1.js - Core Mapping Engine & Geometrie (Fehlerbereinigt)
 */

let map = null;
let routeLine = null;
let currentMarker = null;
let targetMarker = null;

// Konfiguration Dark Theme (CartoDB Dark Matter)
const DARK_TILE_URL = 'https://{s}://{z}/{x}/{y}{r}.png';
const MAP_ATTRIBUTION = '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com">CARTO</a>';

/**
 * Initialisiert das Leaflet-Kartensystem auf dem bereitstehenden HTML-Element.
 */
function initLeafletMapSystem(containerId, defaultLat = 52.520008, defaultLng = 13.404954) {
    if (map) return; // Verhindert Mehrfach-Initialisierung

    // Reine 2D-Karte mit Maus-Drag und Scroll-Zoom
    map = L.map(containerId, {
        zoomControl: true,
        boxZoom: true,
        doubleClickZoom: true,
        dragging: true,
        scrollWheelZoom: true,
        wheelDebounceTime: 40
    }).setView([defaultLat, defaultLng], 13);

    L.tileLayer(DARK_TILE_URL, {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19
    }).addTo(map);

    // Initialen Positionsmarker setzen
    currentMarker = L.marker([defaultLat, defaultLng]).addTo(map)
        .bindPopup("Aktueller Standort")
        .openPopup();
}

/**
 * Aktualisiert die visuelle Position des Benutzers auf der Karte
 */
function updateMapUserPosition(lat, lng) {
    if (!map) return;
    currentMarker.setLatLng([lat, lng]);
}

/**
 * Zentriert die Ansicht auf den Benutzer
 */
function centerMapOnUser(lat, lng) {
    if (map) {
        map.setView([lat, lng], 15);
    }
}

/**
 * Setzt oder aktualisiert den Ziel-Marker (Syntaxfehler behoben)
 */
function updateMapTargetMarker(lat, lng, label = "Ziel") {
    if (!map) return;
    if (targetMarker) {
        targetMarker.setLatLng([lat, lng]).setPopupContent(label);
    } else {
        targetMarker = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://githubusercontent.com',
                shadowUrl: 'https://cloudflare.com',
                iconSize:,
                iconAnchor:,
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup(label);
    }
    targetMarker.openPopup();
}

/**
 * Zeichnet eine neue blaue Routenlinie basierend auf einem Array von Geopunkten
 */
function drawRouteOnMap(pointsArray) {
    if (!map) return;
    
    // Falls alte Linie existiert, entfernen
    clearRouteFromMap();

    // Erstelle ein Leaflet-kompatibles LatLng-Array
    const latLngs = pointsArray.map(p => [p.lat, p.lng]);

    routeLine = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 6,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(map);

    // Kartenausschnitt an Route anpassen
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

/**
 * Entfernt die Routenlinie von der Karte
 */
function clearRouteFromMap() {
    if (routeLine && map) {
        map.removeLayer(routeLine);
        routeLine = null;
    }
}

/**
 * Aktualisiert die Routenlinie dynamisch (löscht das erste/abgefahrene Teilstück)
 */
function updateActiveRouteLine(remainingPoints) {
    if (!routeLine || !map) return;
    const latLngs = remainingPoints.map(p => [p.lat, p.lng]);
    routeLine.setLatLngs(latLngs);
}

/**
 * Mathematische Distanzberechnung zwischen zwei Koordinaten (Haversine-Formel) in Metern.
 */
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Erdradius in Metern
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
