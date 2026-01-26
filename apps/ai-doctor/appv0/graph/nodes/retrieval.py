from app.graph.state import AgentState
from app.services.vector_store import search_documents

async def retrieve(state: AgentState) -> dict:
    """
    The Retrieval Node:
    Queries Supabase pgvector for relevant medical guidelines.
    """
    
    print("---NODE: RETRIEVING DOCUMENTS (SUPABASE)---")
    question = state["question"]
    
    documents = await search_documents(question, limit=3)
    print(f"---RETRIEVED {len(documents)} DOCS---")
    
    
    return {"documents": documents}