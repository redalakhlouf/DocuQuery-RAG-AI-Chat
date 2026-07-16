from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings 
from app.core.security import get_current_user
from app.routes.documents import router as documents_router
from app.routes.chat import router as chat_router
from app.routes.retrieval import router as retrieval_router

app=FastAPI(title="DocuQuery API")

# CORS middleware pour permettre les tests depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, remplacer par les origines spécifiques
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(retrieval_router)

@app.get("/health")
def health_check():
    return {"status":"ok"}

@app.get("/api/v1/me")
async def read_current_user(current_user: str = Depends(get_current_user)):
    return {"user_id": current_user}