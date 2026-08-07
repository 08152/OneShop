// 1. Karte initialisieren (Startansicht Deutschland)
const map = L.map('map', {
    tap: false // Wichtig für reibungslosen Touch-Support auf Chromebooks
}).setView([51.1657, 10.4515], 6); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
}).addTo(map);

// 2. Auto-Marker (Emoji als Icon) erstellen
const carIcon = L.divIcon({
    html: '<div style="font-size: 28px; transform: translate(-10px, -10px);">🚗</div>',
    iconSize:,
    className: 'car-icon'
});

// Startposition des Autos (Standard: Berlin)
let carMarker = L.marker([52.52, 13.40], { icon: carIcon }).addTo(map);
carMarker.bindPopup("Fahrzeug-Position");

// 3. Fokus-Funktion (Optimiert für Klick und Touch)
const focusBtn = document.getElementById('focus-btn');
function focusOnCar(e) {
    if(e) e.preventDefault();
    const coords = carMarker.getLatLng();
    map.flyTo(coords, 14, {
        animate: true,
        duration: 1.2
    });
}
focusBtn.addEventListener('click', focusOnCar);
focusBtn.addEventListener('touchstart', focusOnCar, {passive: false});

// 4. GPS-Standort aktivieren
const locateBtn = document.getElementById('locate-btn');

function triggerLocation(e) {
    if(e) e.preventDefault();
    map.locate({ setView: true, maxZoom: 14 });
}
locateBtn.addEventListener('click', triggerLocation);
locateBtn.addEventListener('touchstart', triggerLocation, {passive: false});

map.on('locationfound', (e) => {
    const userLocation = e.latlng;
    carMarker.setLatLng(userLocation);
    document.getElementById('start').value = `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
});

map.on('locationerror', () => {
    alert("Standortzugriff verweigert oder nicht verfügbar. Bitte GPS freigeben.");
});

// 5. Routing Engine & Geocoding
let routingControl = null;

async function geocode(address) {
    if (!address) return null;
    
    // Falls es bereits Koordinaten sind (durch Standorterkennung)
    if (address.includes(',')) {
        const parts = address.split(',');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return L.latLng(parseFloat(parts[0]), parseFloat(parts[1]));
        }
    }
    
    try {
        const response = await fetch(`https://openstreetmap.org{encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return L.latLng(data[0].lat, data[0].lon);
        }
    } catch (error) {
        console.error("Geocoding Fehler:", error);
    }
    return null;
}

// Klick- & Touch-Event für Routenberechnung
async function calculateRoute(e) {
    if(e) e.preventDefault();
    const startInput = document.getElementById('start').value;
    const zielInput = document.getElementById('ziel').value;

    if (!startInput || !zielInput) {
        alert("Bitte Start und Ziel eingeben.");
        return;
    }

    const startCoords = await geocode(startInput);
    const zielCoords = await geocode(zielInput);

    if (!startCoords || !zielCoords) {
        alert("Ort nicht gefunden. Bitte Schreibweise prüfen.");
        return;
    }

    // Alte Route löschen falls vorhanden
    if (routingControl) {
        map.removeControl(routingControl);
    }

    // Neue Route erstellen
    routingControl = L.Routing.control({
        waypoints: [startCoords, zielCoords],
        routeWhileDragging: false,
        show: false, // Textbox der Navigation ausblenden
        createMarker: function() { return null; } // Keine Standard-Marker erstellen
    }).addTo(map);

    // Auto an den Start setzen
    carMarker.setLatLng(startCoords);

    // Auswertung nach erfolgreicher Routenberechnung
    routingControl.on('routesfound', function(event) {
        const summary = event.routes[0].summary;
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        const totalMinutes = Math.round(summary.totalTime / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        let durationText = hours > 0 ? `${hours} Std. ${minutes} Min.` : `${minutes} Min.`;

        document.getElementById('distance').innerHTML = `<strong>Distanz:</strong> ${distanceKm} km`;
        document.getElementById('duration').innerHTML = `<strong>Dauer:</strong> ${durationText}`;
        document.getElementById('route-info').style.display = 'block';
        
        // Kartenausschnitt an Route anpassen
        const bounds = L.latLngBounds(startCoords, zielCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
    });
}

document.getElementById('route-btn').addEventListener('click', calculateRoute);
document.getElementById('route-btn').addEventListener('touchstart', calculateRoute, {passive: false});
