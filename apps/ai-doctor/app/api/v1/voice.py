from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/triage")
async def voice_triage(websocket: WebSocket):
    """
    Real-Time Voice Triage Endpoint.
    1. Accepts WebSocket connection.
    2. Receives Audio Stream (Blobs) from Frontend.
    3. (Future) Forwards to Gemini Live.
    """
    
    await websocket.accept()
    print("--- VOICE SESSION STARTED ---")
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received: {data}")
            
            await websocket.send_text(f"Physician heard: {data}")

    except WebSocketDisconnect:
        print("--- PATIENT DISCONNECTED ---")
    except Exception as e:
        print(f"--- VOICE ERROR: {e} ---")
            