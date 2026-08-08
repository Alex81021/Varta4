let ws, name;

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    // Connects using the current page's domain/IP
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(
    `${proto}//${location.host}/ws/${encodeURIComponent(name)}`
    );

    ws.onmessage = (e) => {
        const box = document.getElementById("messages");
        const div = document.createElement("div");
        const text = e.data;

        // System messages -> Center
        if (text.startsWith("📢") || text.startsWith("❌") || text.includes("thinking")) {
            div.className = "msg system";
            div.textContent = text;
        } 
        // Gemini AI -> Left (Highlighted)
        else if (text.startsWith("🤖 *Gemini*:")) {
            div.className = "msg ai";
            div.textContent = text.replace("🤖 *Gemini*:", "🤖 Gemini:").trim();
        } 
        // My sent message -> Right
        else if (text.startsWith(`${name}:`)) {
            div.className = "msg mine";
            div.textContent = text.substring(name.length + 1).trim();
        } 
        // Others -> Left
        else {
            div.className = "msg others";
            div.textContent = text;
        }

        box.appendChild(div);
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