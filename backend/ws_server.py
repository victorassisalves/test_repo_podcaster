from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List, Dict

app = FastAPI()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.transcripts: List[str] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/audio")
async def websocket_audio(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive audio stream (binary or base64) from client
            # Here, we simulate receiving and sending back a transcript
            data = await websocket.receive_text()
            manager.transcripts.append(data)

            # Send simulated response back to clients
            # Simulate Google Gemini Multimodal Live API response
            await manager.broadcast(f"Google Agent (Simulated): Received {len(data)} characters.")

            # Simulate ElevenLabs WebSocket response
            await manager.broadcast(f"ElevenLabs Agent (Simulated): Processing audio for TTS.")

    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/teleprompter")
async def websocket_teleprompter(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast CrewAI insights to the Studio Teleprompter
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
