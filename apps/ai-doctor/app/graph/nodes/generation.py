from app.graph.state import AgentState
from langchain_core.messages import AIMessage

async def generate(state: AgentState) -> dict:
    """
    Mock generation Node: 
    Produces the final triage advice.
    """
    
    print("---NODE: GENERATING DIAGNOSIS---")

    mock_response = "Based on the guidelines, This patient requires immediate attention."

    return {
        "final_diagnosis": mock_response,
        "messages": [AIMessage(content=mock_response)]
    }