from typing import TypedDict, List, Annotated
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    The immutable state of the Physician Agent.
    The dict is passed between every node in the graph.
    """
    
    # 1. The Input
    question: str
    
    # 2. The context (RAG)
    # We store retrieved text chunks here.
    documents: List[str]
    
    # 3. The Reasoning Trace 
    # 'operator.add' means: When a node returns 'messages',
    # APPEND it to this list instead of overwriting it.
    # This keeps a perfect history of the AI's "thought process".
    messages: Annotated[List[BaseMessage], operator.add]
    
    # 4. Control Flags (For the state machine)
    is_relevant: bool  # did the grader approve the documents
    retry_count: int  # To prevent infinite loops if search fails
    
    # 5. The output
    final_diagnosis: str | None
    
    