import asyncio
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from google import genai
import uvicorn


app = FastAPI()
ai_client = genai.Client()


# Serve static files
@app.get("/")
async def get_index():
    return FileResponse("index.html")


@app.get("/style.css")
async def get_css():
    return FileResponse("style.css", media_type="text/css")


@app.get("/script.js")
async def get_js():
    return FileResponse("script.js", media_type="application/javascript")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections.copy():
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


async def handle_gemini_reply(user_prompt: str):
    try:
        await manager.broadcast("🤖 Gemini is thinking...")

        response = await ai_client.aio.models.generate_content(
            model="gemini-3.6-flash",
            contents=user_prompt,
        )

        await manager.broadcast(f"🤖 Gemini: {response.text}")

    except Exception as e:
        await manager.broadcast(f"⚠️ Error: {e}")


@app.websocket("/ws/{client_name}")
async def websocket_endpoint(websocket: WebSocket, client_name: str):
    await manager.connect(websocket)
    await manager.broadcast(f"📢 {client_name} joined!")

    try:
        while True:
            data = await websocket.receive_text()

            # Broadcast the original message
            await manager.broadcast(f"{client_name}: {data}")

            # Check for @gemini without modifying the actual prompt
            if "@gemini" in data.lower():
                prompt = data[data.lower().find("@gemini") + len("@gemini"):].strip()

                if prompt:
                    asyncio.create_task(handle_gemini_reply(prompt))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"❌ {client_name} left.")


if __name__ == "__main__":
       port = int(os.environ.get("PORT", 8080))
       uvicorn.run(app, host="0.0.0.0", port=port)
       