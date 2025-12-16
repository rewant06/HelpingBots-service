from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1.triage import router as triage_router
from app.api.v1.voice import router as voice_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- Doctor is in (Startup) ---")
    yield
    print("---Doctor is out (shutdown)")

app = FastAPI(
    title="Dr. Reach - AI Physician",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(triage_router, prefix="/api/v1", tags=["Triage"])
app.include_router(voice_router, tags=["Voice"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-doctor"}