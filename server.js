<script>
    const RENDER_URL = 'https://onrender.com';
    
    // HIER OPTIMIERT: Verbindungskonfiguration korrigiert
    const socket = io(RENDER_URL, {
        transports: ['websocket', 'polling']
    });
    let isAuthorized = false;

    socket.on('connect', () => {
        document.getElementById('server-status').textContent = "ONLINE";
        document.getElementById('server-status').className = "online";
        syncLocalToServer(); 
    });

    socket.on('disconnect', () => {
        document.getElementById('server-status').textContent = "STANDBY (INACTIVE)";
        document.getElementById('server-status').className = "";
    });

    socket.on('live_type', (data) => {
        let liveDiv = document.getElementById('live-broadcast-preview');
        if (!liveDiv) {
            liveDiv = document.createElement('div');
            liveDiv.id = 'live-broadcast-preview';
            liveDiv.style.border = '1px dashed #ff3333';
            liveDiv.style.padding = '10px';
            liveDiv.style.marginBottom = '20px';
            document.getElementById('log-container').prepend(liveDiv);
        }
        liveDiv.innerHTML = `<div style="color:#ff3333; font-size:0.75rem;">[LIVE_BROADCAST_RECEIVING...]</div><div>${data.text}</div>`;
        if(data.text === "") liveDiv.remove();
    });

    socket.on('update_logs', (logs) => {
        renderLogs(logs);
        const liveDiv = document.getElementById('live-broadcast-preview');
        if(liveDiv) liveDiv.remove();
    });

    function focusEditor() {
        document.getElementById('hidden-textarea').focus();
    }

    function updateText(val) {
        document.getElementById('visual-text').textContent = val;
        localStorage.setItem('diary_current_buffer', val);
        socket.emit('typing', { text: val });
    }

    function handleKeys(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            submitLog();
        }
    }

    function checkAuth(e) {
        if (e.key === 'Enter') {
            const input = document.getElementById('auth-code');
            if (input.value === 'Risky_Live') {
                isAuthorized = true;
                document.getElementById('auth-zone').style.display = 'none';
                document.getElementById('write-zone').style.display = 'block';
                
                const savedBuffer = localStorage.getItem('diary_current_buffer') || "";
                document.getElementById('hidden-textarea').value = savedBuffer;
                updateText(savedBuffer);
                
                focusEditor();
            } else {
                input.value = '';
                alert("ZUGRIFF VERWEIGERT");
            }
        }
    }

    function renderLogs(logs) {
        const container = document.getElementById("log-container");
        container.innerHTML = "";
        if(logs.length === 0) {
            container.innerHTML = `<div class="log-entry"><div class="log-text">[System] Keine Einträge auf der Cloud vorhanden.</div></div>`;
            return;
        }
        logs.forEach(log => {
            container.innerHTML += `
                <div class="log-entry">
                    <div class="log-date">${log.date}</div>
                    <div class="log-text">${log.text}</div>
                </div>`;
        });
    }

    function submitLog() {
        const textarea = document.getElementById('hidden-textarea');
        const text = textarea.value.trim();
        if(!text) return;

        const now = new Date();
        const timestamp = `[ LOG_DATE: ${now.toISOString().split('T')} // ${now.toTimeString().split(' ')} ]`;
        const newLog = { date: timestamp, text: text };

        let offlineQueue = JSON.parse(localStorage.getItem('diary_offline_queue')) || [];
        offlineQueue.push(newLog);
        localStorage.setItem('diary_offline_queue', JSON.stringify(offlineQueue));

        textarea.value = "";
        updateText("");
        localStorage.removeItem('diary_current_buffer');
        socket.emit('typing', { text: "" });

        syncLocalToServer();
    }

    async function syncLocalToServer() {
        let offlineQueue = JSON.parse(localStorage.getItem('diary_offline_queue')) || [];
        if(offlineQueue.length === 0) {
            document.getElementById('sync-status').textContent = "CLOUD_SYNCHRONIZED";
            return;
        }

        document.getElementById('sync-status').textContent = "UPLOADING_BUFFER...";

        try {
            const response = await fetch(`${RENDER_URL}/api/logs/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: offlineQueue })
            });

            if (response.ok) {
                localStorage.setItem('diary_offline_queue', JSON.stringify([]));
                document.getElementById('sync-status').textContent = "CLOUD_SYNCHRONIZED";
            }
        } catch (e) {
            document.getElementById('sync-status').textContent = "SERVER_STANDBY_LOKAL_SAFE";
        }
    }
</script>
