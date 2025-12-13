from app.graph.state import AgentState

async def retrieve(state: AgentState) -> dict:
    """
    Mock Retrieval Node:
    In the future, This will query Supabase pgvector.
    """
    
    print("---NODE: RETRIEVING DOCUMENTS---")
    
    # mock data representing a vector search result
    
    mock_docs = [
        "Guideline 1: If patient has chest pain> 10 mins, triage Red.",
        "Guideline 2: Mild fever < 38C is usually Green triage"
    ]
    
    return {"documents": mock_docs}