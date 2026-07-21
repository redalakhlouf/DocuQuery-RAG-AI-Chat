# ROLE: Routes de chat / RAG
#
# POST /api/v1/chat/query                - Poser une question sur un document
# GET  /api/v1/chat/conversations        - Lister les conversations
# GET  /api/v1/chat/conversations/{id}/messages - Historique d'une conversation
#
# Protégées par get_current_user + rate limiting (30 questions/jour).
# Sera implémenté en Phase 6 (retrieval) + Phase 8 (génération).
from fastapi import APIRouter , Depends
from app.core.security import get_current_user

router=APIRouter(prefix="/api/v1/chat",tags=["chat"])

@router.post('/query')
def chat_query(user_id:str=Depends(get_current_user)):
    return {"user_id":user_id,"message":"Chat a implementer en phase 8"}

@router.get('/conversations/')
def list_conversations(user_id:str=Depends(get_current_user)):
    return {"conversations": []}

@router.post('/conversations')
def create_conversation(user_id:str=Depends(get_current_user)):
    return {"conversation_id":"stub","document_id":None,"message":"Phase 8"}

@router.get('/conversations/{conversation_id}/messages')
def get_messages(conversation_id:str,user_id:str=Depends(get_current_user)):
    return {"messages": []}