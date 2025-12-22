import os
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print(" Error: GEMINI_API_KEY not found in .env")
    exit(1)

# 2. Configure the Client
genai.configure(api_key=api_key)

print("--- 🔍 SEARCHING FOR AVAILABLE MODELS ---")
try:
    # 3. List all models available to your key
    count = 0
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f" Found: {m.name}")
            count += 1
    
    if count == 0:
        print(" No generation models found. Check if your API Key has 'Generative Language API' enabled in Google Cloud Console.")
        
except Exception as e:
    print(f" Error connecting to Google: {e}")