let ws, name;

// Function to generate a unique, vibrant color based on a username string
function getUserColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to a hue (0-360) and use vibrant saturation/lightness
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 80%, 40%)`; 
}

function join() {
    name = document.getElementById("nameInput").value.trim();
    if (!name) return;

    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${proto}//${location.host}/ws/${encodeURIComponent(name)}`);

    ws.onmessage = (e) => {
        const box = document.getElementById("messages");
        const rawText = e.data;
        
        const wrapper = document.createElement("div");
        wrapper.className = "msg-wrapper";
        
        const bubble = document.createElement("div");
        const senderLabel = document.createElement("div");
        senderLabel.className = "sender-name";

        // 1. Check for System Messages
        if (rawText.startsWith("📢") || rawText.startsWith("❌") || rawText.includes("thinking") || rawText.startsWith("⚠️")) {
            wrapper.classList.add("system-wrapper");
            bubble.className = "msg system";
            bubble.textContent = rawText;
            wrapper.appendChild(bubble);
        } 
        // 2. Check for Gemini AI
        else if (rawText.startsWith("🤖 Gemini:")) {
            wrapper.classList.add("others-wrapper");
            senderLabel.textContent = "✨ Gemini AI";
            senderLabel.style.color = "#FF416C";
            
            bubble.className = "msg ai";
            bubble.textContent = rawText.replace("🤖 Gemini:", "").trim();
            
            wrapper.appendChild(senderLabel);
            wrapper.appendChild(bubble);
        } 
        // 3. Check for standard user messages
        else {
            const splitIndex = rawText.indexOf(":");
            if (splitIndex !== -1) {
                const senderName = rawText.substring(0, splitIndex).trim();
                const messageContent = rawText.substring(splitIndex + 1).trim();
                
                bubble.textContent = messageContent;

                if (senderName === name) {
                    // It's me
                    wrapper.classList.add("mine-wrapper");
                    bubble.className = "msg mine";
                    wrapper.appendChild(bubble); // No name label needed for my own messages
                } else {
                    // It's someone else
                    wrapper.classList.add("others-wrapper");
                    senderLabel.textContent = senderName;
                    
                    // Apply dynamic color
                    const userColor = getUserColor(senderName);
                    senderLabel.style.color = userColor;
                    
                    bubble.className = "msg others";
                    bubble.style.background = userColor;
                    bubble.style.border = `1px solid ${userColor}`;
                    
                    wrapper.appendChild(senderLabel);
                    wrapper.appendChild(bubble);
                }
            } else {
                // Fallback if formatting breaks
                bubble.className = "msg others";
                bubble.textContent = rawText;
                wrapper.appendChild(bubble);
            }
        }

        box.appendChild(wrapper);
        
        // Smooth scroll to bottom
        box.scrollTo({
            top: box.scrollHeight,
            behavior: "smooth"
        });
    };

    // UI Transition
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("chatBox").classList.remove("hidden");
    setTimeout(() => {
        document.getElementById("chatBox").style.opacity = 1;
    }, 50);
}

function send() {
    const input = document.getElementById("msgInput");
    const val = input.value.trim();
    if (val && ws) {
        ws.send(val);
        input.value = "";
    }
}