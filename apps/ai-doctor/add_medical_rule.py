import asyncio
import dotenv load_dotenv
from app.services.vector_store import add_document

load_dotenv()

async def main():
    print("--- DOCTOR'S KNOWLEDGE ENTRY ---")
    print("Type 'exit' to quit.")
    
    while True: 
        topic = input("Enter Condition Name (e.g 'Acute Asthma'):")
        if topic.lower() == 'exit': break
        
        print(f"Paste the clinical guideline for {topic}:")
        content = input("> ")
        
        source = input("Source (e.g., 'AHA Guidelines 2024'): ")
        
        print("Embedding and saving...")
        full_text = f"{topic}: {content}"
        success = await add_document(full_text, source)
        
        if success: 
            print(f" Knowledge Secured. \n")
        else:
            print(" Error Saving.\n")
            
if __name__ == "__main__":
    asyncio.run(main())