import os
from langchain_google_genai import ChatGoogleGenerativeAI

# Define our Brains
# 'Fast' for Grading/Routing (Low Latency)
MODEL_FAST = "gemini-2.5-flash"

# 'Smart' for Diagnosis/Reasoning (High Intelligence)
MODEL_SMART = "gemini-2.5-pro"

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

    llm = ChatGoogleGenerativeAI(
        model=model_name,
        temperature=temperature,
        google_api_key=api_key,
        convert_system_message_to_human=True,
        # Safety settings to prevent blocking medical terms
        safety_settings={
            "HATE": "BLOCK_NONE",
            "HARASSMENT": "BLOCK_NONE",
            "SEXUAL": "BLOCK_NONE",
            "DANGEROUS": "BLOCK_NONE",
        }
    )

    return llm