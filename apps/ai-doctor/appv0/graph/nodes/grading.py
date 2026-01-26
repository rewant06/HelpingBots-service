from pydantic import BaseModel, Field
from app.graph.state import AgentState
from app.services.llm import get_llm

class GradeResponse(BaseModel):
    """
    Binary score for relevance check.
    """
    reasoning: str = Field(description="Why is this document relevant or irrelevant?")
    binary_score: str = Field(description="'yes' if the document is relevant, 'no' if not.")

async def grade_documents(state: AgentState) -> dict:
    
    """
    Determine if the retrieved documents are relevant to the question.
    Uses the Fast Brain (Gemini Flash) for low latency.
    """
    print("---  NODE: GRADING DOCUMENTS---")
    
    question = state["question"]
    documents = state["documents"]
    
    llm = get_llm(mode="fast", temperature=0)
    structured_llm = llm.with_structured_output(GradeResponse)

    if not documents: 
        print("---DECISION: NO DOCUMENTS FOUND---")
        return {"is_relevant": False, "retry_count": state["retry_count"]}
    
    doc_text = documents[0] # Taking the first chunk for phase 1 testing
    
    system_prompt = f""" You are a medical grader assesing relevance.
    Does the following document contain keywords or concepts related to the user question?
    
    User Question: {question}
    Retrieved Document: {doc_text}
    
    Giva a binary score 'yes' or 'no'."""
    
    # Execute
    try: 
        grade: GradeResponse = await structured_llm.ainvoke(system_prompt)
        
        is_relevant = grade.binary_score.lower() == "yes"
        print(f"---GRADER SAYS: {grade.binary_score.upper()} ({grade.reasoning})---")

        return {
            "is_relevant": is_relevant,
            "retry_count": state["retry_count"]
        }
    
    except Exception as e:
        print(f"---GRADER ERROR: {e}---")
        # Fallback: Assume relevant to avoid breaking flow, but log error
        return {"is_relevant": True, "retry_count": state["retry_count"]}