const mapIsOnline = navigator.onLine && window.location.protocol !== 'file:';
let leafletMap = null;
let routeLayerGroup = null;
let liveUserMarker = null;

document.addEventListener("DOMContentLoaded", () => {
    const mapView = document.getElementById("map-view");

    if (mapIsOnline) {
        leafletMap = L.map('map-view', { zoomControl: false }).setView([51.1657, 10.4515], 6);
        L.control.zoom({ position: 'bottomleft' }).addTo(leafletMap);
        
        L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(leafletMap);

        routeLayerGroup = L.layerGroup().addTo(leafletMap);
        startMapLocationTracking();
    } else {
        mapView.className = "offline-grid-bg";
        mapView.innerHTML = `<div><h1 style="color:#66fcf1;">Offline Matrix</h1><p>GPS & Sprachhilfe laufen mathematisch offline!</p></div>`;
    }
});

function startMapLocationTracking() {
    if (navigator.geolocation && leafletMap) {
        navigator.geolocation.watchPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            if (!liveUserMarker) {
                liveUserMarker = L.circleMarker([lat, lon], {
                    radius: 9, color: '#ffffff', fillColor: '#00ff00', fillOpacity: 1, weight: 3
                }).addTo(leafletMap).bindPopup("Aktueller Standort");
            } else {
                liveUserMarker.setLatLng([lat, lon]);
            }

            if (typeof currentRoutePoints !== "undefined" && currentRoutePoints.length > 0) {
                handleLiveNavigationProgress(lat, lon);
            }
        }, (err) => console.log("GPS-Warte-Signal: ", err), { enableHighAccuracy: true });
    }
}

function renderRouteOnMap(coordinates) {
    if (!leafletMap || !routeLayerGroup) return;
    routeLayerGroup.clearLayers();

    const mainLine = L.polyline(coordinates, { color: '#00d2ff', weight: 7, opacity: 0.85 }).addTo(routeLayerGroup);
    L.polyline(coordinates, { color: '#ffffff', weight: 2, opacity: 1 }).addTo(routeLayerGroup);

    leafletMap.fitBounds(mainLine.getBounds(), { padding: [50, 50] });
}

function clearMapRoute() {
    if (routeLayerGroup) routeLayerGroup.clearLayers();
}

window.addEventListener('resize', () => {
    if (leafletMap) leafletMap.invalidateSize();
});
