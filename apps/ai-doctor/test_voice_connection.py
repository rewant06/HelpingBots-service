import asyncio
import websockets
import json
import base64


async def test_live_session():
    uri = "ws://localhost:8001/ws/triage"
    print(f" Connecting to {uri}...")
    async with websockets.connect(uri) as ws:
        print(" Connected! Initializing Session...")
        
        user_msg = {
            "client_content": {
                "turns": [
                    {
                    "role": "user",
                    "parts": [{ "text": "Hello Doctor, I have a fever."}]
                    }
                    ],
                "turn_complete": True
                }
        }
        
        print(" Sending: 'Hello Doctor, I have a fever.'")
        await ws.send(json.dumps(user_msg))
        print(" Listening for Audio Response...")
        
        audio_chunks_received = 0
        
        try: 
            while audio_chunks_received < 3:
                response = await ws.recv()
                data = json.loads(response)
                
                if "serverContent" in data:
                    model_turn = data["serverContent"].get("modelTurn")
                    if model_turn:
                        parts = model_turn.get("parts", [])
                        for p in parts:
                            if "inlineData" in p:
                                audio_len = len(p["inlineData"]["data"])
                                print(f" Received Audio Chunk ({audio_len} bytes)")
                                audio_chunks_received += 1
                                
        except Exception as e:
            print(f" Loop ended: {e}")
    print(" Test Complete: Received Audio Stream from Gemini.")
    
if __name__ == "__main__":
    asyncio.run(test_live_session())