from app.graph.state import AgentState
from langchain_core.messages import AIMessage
from app.services.llm import get_llm

async def generate(state: AgentState) -> dict:
    """
    The Physician Node.
    Uses 'Gemini 2.5 Pro' (Smart Brain) to synthesize a diagnosis.
    Enforces a 'Think first' pattern using <analysis> tags.
    """
    
    print("---NODE: GENERATING DIAGNOSIS---")
    
    question = state["question"]
    documents = state["documents"]
    
    # Initialize smart brain
    # Temperature 0.4 allows for a slightly more natural, empathetic tone
    # While keeping facts strict.
    
    llm = get_llm(mode="smart", temperature=0.4)
    
    # context conststruction
    context_text = "\n\n".join(documents)
    
    # The Veteran Prompt
    system_prompt = f"""You are a Veteran AI Physician.
    Your goal is to provide safe, concise, and medical-grade triage advice.
    
    INSTRUCTIONS:
    1. Analyze the Context Guidelines below.
    2. FIRST, write an internal <analysis> block containing:
    - Key Symptoms
    - Red Flags (if any)
    - Differenctial Diagnosis
    - Recommended Triage Level (Green/Yellow/Red)
    3. SECOND, write your response to the patient.
    - Be concise.
    - Do NOT say "I am an AI". Act like a professional doctor.
    - If the context doesn't answer the question, advice seeing a doctor safely.
    
    CONTEXT GUIDELINES: 
    {context_text}
    
    PATIENT QUESTION: 
    {question}
    """
    
    try:
        response = await llm.ainvoke(system_prompt)
        content = response.content
        
        # We store the full raw content (Analysis + Speech) in the history
        # In the API layer, we can parse out hte <analysis> if we want to hide it form the frontend
        
        return {
            "final_diagnosis": content,
            "messages": [AIMessage(content=content)]
        }
    
    except Exception as e:
        print(f"---GENERATION ERROR: {e}---")
        return {
            "final_diagnosis": "I apologize, but I'm unable to process your request at this moment. Please consult a human physician immediately.",
            "messages": []
        }