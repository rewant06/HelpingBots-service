from app.graph.state import AgentState

async def grade_documents(state: AgentState) -> dict:
    
    """
    Mock Grading Node:
    In the future, an LLM will evaluate document relevance.
    """
    print("---  NODE: GRADING DOCUMENTS---")
    
    # Mock Logic: Always say yes to test the 'Happy path'
    is_relevant = True
    
    return {
        "is_relevant": is_relevant,
        "retry_count": state.get("retry_count", 0)
    }