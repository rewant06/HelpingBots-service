import os
from langchain_google_genai import ChatGoogleGenerativeAI
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# Define our Brains
# 'Fast' for Grading/Routing (Low Latency)
MODEL_FAST = "gemini-2.5-flash"

# 'Smart' for Diagnosis/Reasoning (High Intelligence)
# MODEL_SMART = "gemini-2.5-pro"
MODEL_SMART = "gemini-2.5-flash"

def get_llm(mode: str = "fast", temperature: float = 0.0):
    """
    Factory to get the specific Gemini Brain.
    
    Args:
        mode: "fast" (Flash) or "smart" (Pro).
        temperature: 0.0 for deterministic logic, 0.4 for natural explanation.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env")

    # Select the model based on mode
    model_name = MODEL_SMART if mode == "smart" else MODEL_FAST
    
    safety_settings = {
        "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
        "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
        "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE",
    }

    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=api_key,
        safety_settings= safety_settings,
        convert_system_message_to_human=True
        
    )

    return llm