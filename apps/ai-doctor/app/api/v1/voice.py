import os 
import json
import asyncio
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from dotenv import load_dotent

load_dotent()
router = APIRouter()

API_KEY = os.getenv("GEMINI_API_KEY")
HOST = "generativelanguage.googleapis.com"
MODEL = "models/gemini-2.0-flash-exp" #change it to 2.5 flash
URI = f"wss://{HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={API_KEY}"

@router.websocket("/ws/triage")
async def voice_triage(client_ws: WebSocket):
    """
    The Voice Bridge.
    Connects the Patient (Client) to the Physician (Gemini).
    """
    await client_ws.accept()
    print("--- VOICE SESSION INITIALIZING ---")
    
    try: 
        async with websockets.connect(URI) as google_ws:
            print("--- CONNECTED TO GEMINI LIVE ---")
            
            await send_setup_message(google_ws)
            
            receive_task = asyncio.create_task(client_to_google(client_ws, google_ws))
            send_task = asyncio.create_task(google_to_client(google_ws, client_ws))

            await asyncio.gather(receive_task, send_task)
            
    except Exception as e: 
        print(f"--- BRIDGE ERROR: {e} ---")
    
    finally: 
        try: 
            await client_ws.close()
        except:
            pass
        print("--- SESSION ENDED ---")

async def send_setup_message(google_ws):
    """
    Configures the session: Sets the persona and tolls.
    """
    setup_msg = {
        "setup": {
            "model": MODEL,
            "generation_config": {
                "response_modalities": ["AUDIO"],
                "speech_config": {
                    "voice_config": {"prebuilt_voice_config": {"voice_name": "Aoede"}}
                }
            },
            "system_instruction": {
                "parts": [
                    {"text": "You are Physician, a veteran emergency physician. You are concise, calm, and professional. Keep responses short (under 2 sentenses) unless asked for details."}
                ]
            }
        }
    }
    await google_ws.send(json.dumps(setup_msg))