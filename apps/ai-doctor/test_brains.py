from dotenv import load_dotenv
from app.services.llm import get_llm

load_dotenv()

print("--- 🧠 TEST 1: FAST BRAIN (Grader) ---")
try:
    fast_llm = get_llm(mode="fast")
    print(f"Model: {fast_llm.model}")
    res = fast_llm.invoke("Is 'fever' a symptom? Reply YES or NO.")
    print(f"Result: {res.content}")
except Exception as e:
    print(f"❌ FAST FAIL: {e}")

print("\n--- 🧠 TEST 2: SMART BRAIN (Doctor) ---")
try:
    smart_llm = get_llm(mode="smart")
    print(f"Model: {smart_llm.model}")
    res = smart_llm.invoke("Briefly explain mechanism of action for Paracetamol.")
    print(f"Result: {res.content[:100]}...") # Print first 100 chars
except Exception as e:
    print(f"❌ SMART FAIL: {e}")