let ws, name;

// Handcrafted Vice City Neon Palette
const vicePalette = [
    "#ff2a8d", // Hot Pink
    "#00f0ff", // Electric Cyan
    "#ff7e33", // Sunset Orange
    "#ffe600", // Neon Yellow
    "#a855f7", // Vice Purple
    "#34d399", // Tropical Mint
    "#ff5252"  // Neon Coral
];

function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % vicePalette.length);
    return vicePalette[index];
}

function getInitials(username) {
    if (!username) return "VI";
    return username.trim().substring(0, 2).toUpperCase();
}

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(name)}`);

    // Set sidebar user details
    document.getElementById("myUsername").textContent = name.toUpperCase();
    const avatarEl = document.getElementById("myAvatar");
    avatarEl.textContent = getInitials(name);
    avatarEl.style.backgroundColor = getUserColor(name);
    avatarEl.style.boxShadow = `0 0 12px ${getUserColor(name)}`;

    ws.onmessage = (e) => {
        const feed = document.getElementById("messages");
        const rawText = e.data;
        
        const row = document.createElement("div");
        row.className = "msg-row";

        // 1. System notices (Broadcasts, Join/Leave)
        if (rawText.startsWith("📢") || rawText.startsWith("❌") || rawText.includes("thinking") || rawText.startsWith("⚠️")) {
            row.className = "msg-row system-row";
            row.innerHTML = `<div class="system-pill">${rawText}</div>`;
        } 
        // 2. Gemini AI response
        else if (rawText.startsWith("🤖 Gemini:")) {
            row.className = "msg-row ai-row";
            const content = rawText.replace("🤖 Gemini:", "").trim();
            
            row.innerHTML = `
                <div class="gta-avatar" style="background: linear-gradient(135deg, #ff2a8d, #7000ff); box-shadow: 0 0 12px #ff2a8d;">AI</div>
                <div class="msg-body">
                    <span class="msg-author" style="color: #ff2a8d; text-shadow: 0 0 8px rgba(255,42,141,0.5);">🤖 GEMINI_AI</span>
                    <div class="msg-bubble">${content}</div>
                </div>
            `;
        } 
        // 3. User messages
        else {
            const splitIndex = rawText.indexOf(":");
            if (splitIndex !== -1) {
                const sender = rawText.substring(0, splitIndex).trim();
                const text = rawText.substring(splitIndex + 1).trim();
                const color = getUserColor(sender);
                const initials = getInitials(sender);

                row.innerHTML = `
                    <div class="gta-avatar" style="background-color: ${color}; box-shadow: 0 0 10px ${color};">${initials}</div>
                    <div class="msg-body">
                        <span class="msg-author" style="color: ${color}; text-shadow: 0 0 6px ${color}88;">${sender.toUpperCase()}</span>
                        <div class="msg-bubble">${text}</div>
                    </div>
                `;
            } else {
                row.className = "msg-row system-row";
                row.innerHTML = `<div class="system-pill">${rawText}</div>`;
            }
        }

        feed.appendChild(row);
        feed.scrollTop = feed.scrollHeight;
    };

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