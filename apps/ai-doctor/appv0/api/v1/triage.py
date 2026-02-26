from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.graph.workflow import app_graph
from app.api.deps import verify_api_key

router = APIRouter()

# 1. Define the Input DTO
# This matches exactly what NestJs will send us.

class TriageRequest(BaseModel):
    query: str
    conversation_id: str | None = None
    
# 2. Define the output DTO

class TriageResponse(BaseModel):
    diagnosis: str
    trace: list[str] = []
    
@router.post("/triage", response_model=TriageResponse)
async def triage_endpoint(
    payload: TriageRequest,
    context: dict = Depends(verify_api_key)
    ):
    """
    The main entry point for the AI Doctor.
    Accepts a symptom query, runs the LangGraph, and returns advice.
    """
    
    try: 
        user_id = context["user_id"]
        print(f"Processing triage for User: {user_id}, Tenant: {context['tenant_id']}")
        initial_inputs = {
            "question": payload.query,
            "retry_count":0,
            "messages":[]
        }
        
        result = await app_graph.ainvoke(initial_inputs)
        final_answer = result.get("final_diagnosis", "I could not determine a diagnosis")
        
        return TriageResponse(
            diagnosis=final_answer,
            trace=["Retrieved docs..." "Graded relevant..."] # We will make this real later
        )
    
    except Exception as e:
        print(f"ERROR execution graph: {e}")
        raise HTTPException(status_code=500, detail="Internal Logic Error")