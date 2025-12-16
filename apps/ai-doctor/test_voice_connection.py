import asyncio
import websockets

async def test_connection():
    uri = "ws://localhost:8001/ws/triage"
    
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            await websocket.send("Hello Doctor")
            response = await websocket.recv()
            print(f"Server Replied: {response}")
    
    except Exception as e:
        print(f"Connection failed: {e}")
        
if __name__ == "__main__":
    asyncio.run(test_connection())