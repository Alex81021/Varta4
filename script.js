let ws = null;
let currentUser = "";

// Dynamic pastel theme generator per user
function getUserTheme(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
        bg: `hsl(${hue}, 80%, 94%)`,
        border: `hsl(${hue}, 60%, 82%)`,
        text: `hsl(${hue}, 80%, 18%)`,
        author: `hsl(${hue}, 80%, 30%)`
    };
}

function handleJoin(event) {
    if (event) event.preventDefault();
    
    currentUser = document.getElementById("nameInput").value.trim();
    if (!currentUser) return;

    // Fallback host if page is served locally or without hostname
    let host = location.host;
    if (!host || host === "") {
        host = "localhost:8080";
    }

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${proto}//${host}/ws/${encodeURIComponent(currentUser)}`;

    try {
        ws = new WebSocket(wsUrl);
    } catch (err) {
        alert("Could not create WebSocket connection: " + err.message);
        return;
    }

    ws.onopen = () => {
        document.getElementById("statusText").textContent = "Online";
        document.getElementById("statusDot").classList.remove("disconnected");
    };

    ws.onmessage = (e) => {
        const feed = document.getElementById("messages");
        const raw = e.data;

        // 1. System Notifications
        if (raw.startsWith("📢") || raw.startsWith("❌") || raw.includes("thinking")) {
            const sysDiv = document.createElement("div");
            sysDiv.className = "msg-system";
            sysDiv.textContent = raw;
            feed.appendChild(sysDiv);
        }
        // 2. Sent by current user
        else if (raw.startsWith(`${currentUser}:`)) {
            const text = raw.substring(currentUser.length + 1).trim();
            feed.appendChild(createMessageBubble("You", text, "mine"));
        }
        // 3. Sent by Gemini AI
        else if (raw.startsWith("🤖 **Gemini**:") || raw.startsWith("🤖 Gemini:")) {
            const text = raw.replace(/^🤖 (\*\*Gemini\*\*|Gemini):/, "").trim();
            feed.appendChild(createMessageBubble("Gemini AI", text, "ai"));
        }
        // 4. Sent by other users
        else {
            const colonIdx = raw.indexOf(":");
            let author = "User";
            let text = raw;
            if (colonIdx !== -1) {
                author = raw.substring(0, colonIdx).trim();
                text = raw.substring(colonIdx + 1).trim();
            }
            feed.appendChild(createMessageBubble(author, text, "others"));
        }

        feed.scrollTop = feed.scrollHeight;
    };

    ws.onerror = (err) => {
        const feed = document.getElementById("messages");
        const sysDiv = document.createElement("div");
        sysDiv.className = "msg-system";
        sysDiv.textContent = "⚠️ Connection error. Make sure main.py is running.";
        feed.appendChild(sysDiv);
    };

    ws.onclose = () => {
        document.getElementById("statusText").textContent = "Disconnected";
        document.getElementById("statusDot").classList.add("disconnected");
    };

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("chatBox").classList.remove("hidden");
    
    setTimeout(() => {
        document.getElementById("msgInput").focus();
    }, 100);
}

function handleSend(event) {
    if (event) event.preventDefault();

    const input = document.getElementById("msgInput");
    const message = input.value.trim();

    if (!message) return;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert("WebSocket is not connected. Check if your server (main.py) is running!");
        return;
    }

    ws.send(message);
    input.value = "";
    input.focus();
}

function createMessageBubble(sender, text, type) {
    const wrapper = document.createElement("div");
    wrapper.className = `msg-wrapper ${type}`;

    if (type !== "mine") {
        const authorLabel = document.createElement("span");
        authorLabel.className = "msg-author";
        authorLabel.textContent = sender;

        if (type === "others") {
            const theme = getUserTheme(sender);
            authorLabel.style.color = theme.author;
        } else if (type === "ai") {
            authorLabel.style.color = "#7e22ce";
        }
        wrapper.appendChild(authorLabel);
    }

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    if (type === "others") {
        const theme = getUserTheme(sender);
        bubble.style.backgroundColor = theme.bg;
        bubble.style.borderColor = theme.border;
        bubble.style.border = `1px solid ${theme.border}`;
        bubble.style.color = theme.text;
        bubble.style.borderBottomLeftRadius = "4px";
    }

    wrapper.appendChild(bubble);
    return wrapper;
}