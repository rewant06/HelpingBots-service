from langgraph.graph import END, StateGraph
from app.graph.state import AgentState
from app.graph.nodes.retrieval import retrieve
from app.graph.nodes.grading import grade_documents
from app.graph.nodes.generation import generate

# 1. Define the Decision Logic (conditional Edge)
def decide_to_generate(state: AgentState):
    """
    Determines next step based on grading.
    """
    print("---DECISION: CHECKING GRADES---")
    
    if state["is_relevant"]:
        print("---DECISION: RELEVANT -> GENERATE---")
        return "generate"
    
    #(Future logic: If irrelevant, loop back to retrieve)
    print("---DECISION: IRRELEVANT (Mock) -> GENERATE---")
    return "generate"

# 2. Build the Graph
workflow = StateGraph(AgentState)

# 3. Add Nodes
workflow.add_node("retrieve", retrieve)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("generate", generate)

# 4. Define Edges (The FLow)
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "grade_documents")

# conditional edge: From Grader, go to either Generate or Retry
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_generate,
    {
        "generate": "generate",
    }
)
workflow.add_edge("generate", END)

# 5. Compile the Graph
app_graph = workflow.compile()
