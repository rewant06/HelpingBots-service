import asyncio
from dotenv import load_dotenv
from app.services.vector_store import add_document

load_dotenv()

async def seed():
    print("--- SEEDING MEDICAL KNOWLEDGE---")
    
    docs = [
        "Hypertensive Crisis: A systolic blood pressure > 180 mmHg or diastolic > 120 mmHg is a hypertensive emergency if accompained by symptoms like headache, chest pain, or shortness of breath. Immediate ER evaluation is required.",
        "Viral Fever Management: For temperature <101F, rest and hydration are recommended. Paracetamol 500mg  can be taken every 6 hours.",
        "Migraine Symptoms: Unilateral throbbing headache, ofter with nausea and sensitivity to light. BP is usually normal"
    ]
    
    for d in docs: 
        print(f"Embedding & Storing: {d[:30]}...")
        success = await add_document(d, "Dr. Reach Guidelines 2025")
        if success: 
            print("Saved.")
        else:
            print("Failed")
        
    print("---SEEDING COMPLETE---")
    
if __name__ == "__main__":
    asyncio.run(seed())