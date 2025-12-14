import asyncio
from dotenv import load_dotenv
from app.graph.nodes.generation import generate

load_dotenv()

async def test():
    # Scenario: High Blood Pressure Context
    state = {
        "question": "I've a headache and my BP is 180/120. What should I do?",
        "documents": [
            "Hypertensive Crisis: BP > 180/120 with symptoms (headache, chest pain) requires immediate ER evaluation.",
            "Tension Headache: Mild headache with normal BP is treated with analgesics."
        ],
        "messages": []
    }
    
    print("--- TEST: PHYSICIAN NODE ---")
    res = await generate(state)
    
    print("\n--- RAW OUTPUT ---")
    print(res["final_diagnosis"])
    
if __name__ == "__main__":
    asyncio.run(test())