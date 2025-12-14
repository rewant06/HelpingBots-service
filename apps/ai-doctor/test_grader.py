import asyncio 
from dotenv import load_dotenv
from app.graph.nodes.grading import grade_documents

load_dotenv()

async def test():
    # Scenario 1: Relevant
    state_good = {
        "question": "What is the dosage for Tylenol?",
        "documents": ["Acetaminophen (Tylenol) standard dose is 500mg-1000mg every 6 hours"],
        "retry_count": 0
    }
    
    print("\n Test 1: Expecting yes...")
    res1 = await grade_documents(state_good)
    print(f"Result: {res1['is_relevant']}")
    
    # Scenario 2: Irrelevant
    
    state_bad = {
        "question": "What is the dosage for Tylenol?",
        "documents": ["The weather in Bangalore is 28 degrees Celsius."],
        "retry_count": 0
    }
    
    print("\n Test 2: Expecting No...")
    res2 = await grade_documents(state_bad)
    print(f"Result: {res2['is_relevant']}")
    
if __name__ == "__main__":
    asyncio.run(test())