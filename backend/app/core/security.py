# ROLE: Vérifie les tokens JWT émis par Supabase Auth
#
# Fonction principale: valider le token, extraire le user_id
# Utilisé comme dependency FastAPI pour protéger les routes
#
# Sera implémenté en Phase 4 avec la fonction get_current_user.
import jwt
import logging
from fastapi import HTTPException , status
from app.core.config import settings
from jwt import PyJWKClient
from fastapi import Depends , Header

logger = logging.getLogger(__name__)

jwks_client=PyJWKClient(f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json")

def verify_token(token:str) -> str:
    try:
        signing_key=jwks_client.get_signing_key_from_jwt(token)
        payload=jwt.decode(token ,signing_key.key , algorithms=["ES256"] , audience="authenticated",)
        user_id:str=payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Token invalide")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Token expiré")
    except jwt.InvalidTokenError as e :
        logger.error("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide"
        )
async def get_current_user(authorization:str=Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Token manquant")
    token=authorization.replace("Bearer " , "")
    return verify_token(token)
