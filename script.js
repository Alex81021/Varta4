let ws, name;

// Generates a deterministic, vibrant HSL color derived from the user's name string
function getUserColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 25%)`; // Dark vibrant color for message bubble background
}

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(name)}`);

    document.getElementById("userBadge").textContent = `@${name}`;

    ws.onmessage = (e) => {
        const box = document.getElementById("messages");
        const div = document.createElement("div");
        const text = e.data;

        // System messages -> Centered Capsule
        if (text.startsWith("📢") || text.startsWith("❌") || text.includes("thinking")) {
            div.className = "msg system";
            div.textContent = text;
        } 
        // Gemini AI -> Styled Left Bubble
        else if (text.startsWith("🤖 **Gemini**:")) {
            div.className = "msg ai";
            div.innerHTML = `<span class="msg-author">🤖 Gemini</span>${text.replace("🤖 **Gemini**:", "").trim()}`;
        } 
        // Current User -> Right Blue Bubble
        else if (text.startsWith(`${name}:`)) {
            div.className = "msg mine";
            div.textContent = text.substring(name.length + 1).trim();
        } 
        // Other Users -> Dynamic Colored Left Bubbles
        else {
            div.className = "msg others";
            const parts = text.split(":");
            const sender = parts[0];
            const content = parts.slice(1).join(":").trim();

            div.style.backgroundColor = getUserColor(sender);
            div.innerHTML = `<span class="msg-author">${sender}</span>${content}`;
        }

        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    };

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("chatBox").classList.remove("hidden");
}

function send() {
    const input = document.getElementById("msgInput");
    if (input.value.trim() && ws) {
        ws.send(input.value);
        input.value = "";
    }
}