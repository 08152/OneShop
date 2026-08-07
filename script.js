const isOnline = navigator.onLine && window.location.protocol !== 'file:';
let startGeoData = null;
let targetGeoData = null;
let currentRoutePoints = []; 
let trackingInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    setInterval(updateClockDisplay, 1000);
    updateClockDisplay();

    const statusIndicator = document.getElementById("status-indicator");

    if (!isOnline) {
        statusIndicator.innerText = "Offline";
        statusIndicator.style.color = "#e74c3c";
        statusIndicator.style.borderColor = "#e74c3c";
    }

    activateSearchAutocomplete('start-node', 'start-suggestions', (data) => { startGeoData = data; });
    activateSearchAutocomplete('target-node', 'target-suggestions', (data) => { targetGeoData = data; });
});

function updateClockDisplay() {
    const now = new Date();
    document.getElementById("clock-display").innerText = "Uhrzeit: " + now.toLocaleTimeString('de-DE');
}

function activateSearchAutocomplete(inputId, boxId, selectCallback) {
    const inputField = document.getElementById(inputId);
    const suggestionsBox = document.getElementById(boxId);
    let searchTimeout = null;

    inputField.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const queryText = inputField.value.trim();
        if (queryText.length < 3) { suggestionsBox.style.display = 'none'; return; }

        searchTimeout = setTimeout(() => {
            if (isOnline) {
                fetch(`https://openstreetmap.org{encodeURIComponent(queryText)}&limit=5`)
                    .then(res => res.json())
                    .then(searchResults => {
                        suggestionsBox.innerHTML = '';
                        if (searchResults.length === 0) { suggestionsBox.style.display = 'none'; return; }
                        searchResults.forEach(place => {
                            const row = document.createElement('div');
                            row.className = 'suggestion-item';
                            row.innerText = place.display_name.split(',').slice(0, 3).join(',');
                            row.onclick = () => {
                                inputField.value = row.innerText;
                                suggestionsBox.style.display = 'none';
                                selectCallback({ lat: parseFloat(place.lat), lon: parseFloat(place.lon), name: row.innerText });
                            };
                            suggestionsBox.appendChild(row);
                        });
                        suggestionsBox.style.display = 'block';
                    });
            } else {
                suggestionsBox.innerHTML = '';
                const row = document.createElement('div');
                row.className = 'suggestion-item';
                row.innerText = `[Offline] ${queryText}`;
                row.onclick = () => {
                    inputField.value = queryText;
                    suggestionsBox.style.display = 'none';
                    selectCallback(generateOfflineCoordinates(queryText));
                };
                suggestionsBox.appendChild(row);
                suggestionsBox.style.display = 'block';
            }
        }, 400);
    });
    document.addEventListener('click', (event) => { if (event.target !== inputField) suggestionsBox.style.display = 'none'; });
}

function generateOfflineCoordinates(stringName) {
    let cryptographicHash = 0;
    for (let i = 0; i < stringName.length; i++) cryptographicHash = stringName.charCodeAt(i) + ((cryptographicHash << 5) - cryptographicHash);
    return { lat: 48.0 + Math.abs((cryptographicHash % 100) / 25), lon: 11.0 + Math.abs(((cryptographicHash >> 8) % 100) / 25), name: stringName };
}

function computeHaversineDistance(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 1.25;
}

function speakVoiceGuidance(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'de-DE';
        window.speechSynthesis.speak(utterance);
        document.getElementById("speech-box").innerHTML = `🔊 " ${text} "`;
    }
}

function calculate2DRoute() {
    const startVal = document.getElementById("start-node").value;
    const targetVal = document.getElementById("target-node").value;

    if (!startGeoData) startGeoData = generateOfflineCoordinates(startVal || "Start");
    if (!targetGeoData) targetGeoData = generateOfflineCoordinates(targetVal || "Ziel");

    currentRoutePoints = [
        { lat: startGeoData.lat, lon: startGeoData.lon, cmd: "Navigation gestartet. Folgen Sie der Straße." },
        { lat: startGeoData.lat + (targetGeoData.lat - startGeoData.lat) * 0.3, lon: startGeoData.lon + (targetGeoData.lon - startGeoData.lon) * 0.4, cmd: "In fünfhundert Metern rechts abbiegen auf die Hauptstraße." },
        { lat: startGeoData.lat + (targetGeoData.lat - startGeoData.lat) * 0.7, lon: startGeoData.lon + (targetGeoData.lon - startGeoData.lon) * 0.6, cmd: "In Kürze links abbiegen auf die Autobahn." },
        { lat: targetGeoData.lat, lon: targetGeoData.lon, cmd: "Sie haben Ihr Ziel erreicht." }
    ];

    updateRouteDisplay();
    speakVoiceGuidance(`Navigation gestartet. Strecke beträgt ${document.getElementById("val-km").innerText}.`);
    
    if (!isOnline) {
        clearInterval(trackingInterval);
        let step = 0;
        trackingInterval = setInterval(() => {
            if(step < currentRoutePoints.length) {
                const node = currentRoutePoints[step];
                handleLiveNavigationProgress(node.lat, node.lon);
                step++;
            } else {
                clearInterval(trackingInterval);
            }
        }, 8000);
    }
}

function updateRouteDisplay() {
    const rawCoords = currentRoutePoints.map(p => [p.lat, p.lon]);
    if (rawCoords.length < 2) return;

    let remainingKm = 0;
    for(let i=0; i<rawCoords.length-1; i++) {
        remainingKm += computeHaversineDistance(rawCoords[i], rawCoords[i], rawCoords[i+1], rawCoords[i+1]);
    }

    const etaHours = remainingKm / 80;
    const arrivalTime = new Date(Date.now() + etaHours * 3600000);

    document.getElementById("val-km").innerText = remainingKm.toFixed(1) + " km";
    document.getElementById("val-time").innerText = arrivalTime.toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}) + " Uhr";
    document.getElementById("output-results").style.display = "block";

    if (typeof renderRouteOnMap === "function") {
        renderRouteOnMap(rawCoords);
    }
}

function handleLiveNavigationProgress(userLat, userLon) {
    if (currentRoutePoints.length === 0) return;

    const nextTargetNode = currentRoutePoints[0];
    const distanceToNextNode = computeHaversineDistance(userLat, userLon, nextTargetNode.lat, nextTargetNode.lon);

    if (distanceToNextNode > 0.5 && currentRoutePoints.length > 1) {
        speakVoiceGuidance("Achtung, Route verlassen. Route wird neu berechnet.");
        startGeoData = { lat: userLat, lon: userLon, name: "Aktueller Standort" };
        calculate2DRoute();
        return;
    }

    if (distanceToNextNode < 0.08) {
        currentRoutePoints.shift();
        
        if (currentRoutePoints.length > 0) {
            speakVoiceGuidance(currentRoutePoints[0].cmd); 
            updateRouteDisplay();
        } else {
            speakVoiceGuidance("Sie haben Ihr Ziel erreicht. Die Navigation ist beendet.");
            if (typeof clearMapRoute === "function") clearMapRoute();
            document.getElementById("output-results").style.display = "none";
        }
    }
}
