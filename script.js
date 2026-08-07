// --- MATHEMATISCHE ENTFERNUNGSBERECHNUNG ---
function getDistanceOffline(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1.28;
}

function trigger3DMapping() {
    const startData = document.getElementById('start-city').value.split(',');
    const targetData = document.getElementById('target-city').value.split(',');
    
    const lat1 = parseFloat(startData[0]); const lon1 = parseFloat(startData[1]);
    const lat2 = parseFloat(targetData[0]); const lon2 = parseFloat(targetData[1]);

    const km = getDistanceOffline(lat1, lon1, lat2, lon2);
    const totalHours = km / 85;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    document.getElementById('res-km').innerText = km.toFixed(0) + " km";
    document.getElementById('res-time').innerText = `${hours} Std. ${minutes} Min.`;
    document.getElementById('results').style.display = "block";

    // Übergabe an das 3D-Karten-Skript (map.js)
    if (typeof draw3DRouteOnMap === "function") {
        draw3DRouteOnMap();
    }
}

// --- ZIP-DOWNLOADER FÜR OFFLINE-BETRIEB ---
function downloadOfflineZip() {
    const zip = new JSZip();
    zip.file("index.html", document.documentElement.outerHTML);
    
    Promise.all([
        fetch('script.js').then(res => res.text()),
        fetch('map.js').then(res => res.text())
    ]).then(([scriptJs, mapJs]) => {
        zip.file("script.js", scriptJs);
        zip.file("map.js", mapJs);
        return zip.generateAsync({type:"blob"});
    }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "3d_matrix_map.zip";
        link.click();
    }).catch(err => {
        console.log("Local execution fallback active.");
        zip.generateAsync({type:"blob"}).then(c => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(c);
            link.download = "map_fallback.zip";
            link.click();
        });
    });
}
