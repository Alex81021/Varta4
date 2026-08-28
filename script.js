let ws, name;

// Helper to calculate avatar color from username string hash
function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 50%)`;
}

// Helper to get 1-2 uppercase initials
function getInitials(username) {
    if (!username) return "?";
    const parts = username.trim().split(" ");
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
}

// Current timestamp formatting (e.g., 10:42 AM)
function getFormattedTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    // Connect via protocol
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(name)}`);

    // Populate user profile info in the sidebar
    document.getElementById("myUsername").textContent = name;
    const avatarEl = document.getElementById("myAvatar");
    avatarEl.textContent = getInitials(name);
    avatarEl.style.backgroundColor = getUserColor(name);

    ws.onmessage = (e) => {
        const feed = document.getElementById("messages");
        const rawText = e.data;
        
        const row = document.createElement("div");
        row.className = "msg-row";

        // 1. System Notices
        if (rawText.startsWith("📢") || rawText.startsWith("❌") || rawText.includes("thinking") || rawText.startsWith("⚠️")) {
            row.classList.add("system-msg");
            row.innerHTML = `<div class="system-pill">${rawText}</div>`;
        } 
        // 2. Gemini AI Messages
        else if (rawText.startsWith("🤖 Gemini:")) {
            row.classList.add("ai-msg");
            const content = rawText.replace("🤖 Gemini:", "").trim();
            
            row.innerHTML = `
                <div class="avatar" style="background-color: #5865f2;">AI</div>
                <div class="msg-content">
                    <div class="msg-header">
                        <span class="msg-author" style="color: #5865f2;">Gemini AI</span>
                        <span class="msg-time">${getFormattedTime()}</span>
                    </div>
                    <div class="msg-text">${content}</div>
                </div>
            `;
        } 
        // 3. User Messages
        else {
            const splitIndex = rawText.indexOf(":");
            if (splitIndex !== -1) {
                const sender = rawText.substring(0, splitIndex).trim();
                const text = rawText.substring(splitIndex + 1).trim();
                const color = getUserColor(sender);
                const initials = getInitials(sender);

                row.innerHTML = `
                    <div class="avatar" style="background-color: ${color};">${initials}</div>
                    <div class="msg-content">
                        <div class="msg-header">
                            <span class="msg-author" style="color: ${color};">${sender}</span>
                            <span class="msg-time">${getFormattedTime()}</span>
                        </div>
                        <div class="msg-text">${text}</div>
                    </div>
                `;
            } else {
                row.classList.add("system-msg");
                row.innerHTML = `<div class="system-pill">${rawText}</div>`;
            }
        }

        feed.appendChild(row);
        
        // Auto Scroll to Bottom
        feed.scrollTop = feed.scrollHeight;
    };

    // Transition from login modal to chat dashboard
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("chatBox").classList.remove("hidden");
}

function send() {
    const input = document.getElementById("msgInput");
    const val = input.value.trim();
    if (val && ws) {
        ws.send(val);
        input.value = "";
    }
}