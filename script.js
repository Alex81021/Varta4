let ws, name;

// Hash algorithm to generate a deterministic pastel color per user
function getUserColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 75%)`; // Pastel tone for dark theme readability
}

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(name)}`);

    ws.onmessage = (e) => {
        const box = document.getElementById("messages");
        const text = e.data;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // System messages -> Center Tag
        if (text.startsWith("📢") || text.startsWith("❌") || text.includes("thinking")) {
            const sysDiv = document.createElement("div");
            sysDiv.className = "system";
            sysDiv.textContent = text;
            box.appendChild(sysDiv);
        } 
        else {
            const wrapper = document.createElement("div");
            const header = document.createElement("div");
            const bubble = document.createElement("div");

            header.className = "msg-header";
            bubble.className = "msg";

            // Gemini AI -> Left with Gradient Border Styling
            if (text.startsWith("🤖 **Gemini**:")) {
                wrapper.className = "msg-wrapper ai";
                header.innerHTML = `<span style="color: #c084fc;">🤖 Gemini AI</span> <span>${time}</span>`;
                bubble.textContent = text.replace("🤖 **Gemini**:", "").trim();
            } 
            // My message -> Right
            else if (text.startsWith(`${name}:`)) {
                wrapper.className = "msg-wrapper mine";
                header.innerHTML = `<span>${time}</span>`;
                bubble.textContent = text.substring(name.length + 1).trim();
            } 
            // Other Users -> Left with Dynamic Dynamic User Colors
            else {
                wrapper.className = "msg-wrapper others";
                const colonIndex = text.indexOf(":");
                const sender = text.substring(0, colonIndex);
                const msgContent = text.substring(colonIndex + 1).trim();

                const userColor = getUserColor(sender);
                header.innerHTML = `<span style="color: ${userColor}">${sender}</span> <span>${time}</span>`;
                bubble.textContent = msgContent;
            }

            wrapper.appendChild(header);
            wrapper.appendChild(bubble);
            box.appendChild(wrapper);
        }

        box.scrollTop = box.scrollHeight; // Auto scroll down
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