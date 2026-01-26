import os
from dotenv import load_dotenv
from supabase import create_client, Client
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")


if not url or not key:
    raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in .env")
supabase: Client = create_client(url, key)

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/text-embedding-004",
    google_api_key=os.environ.get("GEMINI_API_KEY")
)


async def search_documents(query: str, limit: int = 3):
    """
    Real Semantic Search:
    1. Embeds the user query.
    2. Calls Supabase RPC 'match_documents'.
    3. Return list of text chunks.
    """
    try: 
        query_vector = await embeddings.aembed_query(query)
        
        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_vector,
                "match_threshold": 0.5, # Lower threshold = more results
                "match_count": limit
            }
        ).execute()
        
        return [doc['content'] for doc in response.data]
    except Exception as e: 
        print(f"---VECTOR SEARCH ERROR: {e}---")
        return []
    
async def add_document(text: str, source: str):
    """
    Helper to seed data (for testing).
    """
    try:
        vector = await embeddings.aembed_query(text)
        data = {
            "content": text,
            "metadata": {"source": source},
            "embedding": vector
        }
    
        supabase.table("documents").insert(data).execute()
        return True
    except Exception as e:
        print(f"Error adding document: {e}")
        return False