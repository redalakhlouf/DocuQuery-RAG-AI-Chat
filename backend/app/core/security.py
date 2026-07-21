# ROLE: Vérifie les tokens JWT émis par Supabase Auth
#
# Fonction principale: valider le token, extraire le user_id
# Utilisé comme dependency FastAPI pour protéger les routes
import time
import jwt
import logging
from fastapi import HTTPException , status
from app.core.config import settings
from jwt import PyJWKClient
from fastapi import Depends , Header

logger = logging.getLogger(__name__)

_jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
jwks_client = None

for _attempt in range(1, 4):
    try:
        jwks_client = PyJWKClient(_jwks_url)
        break
    except Exception as exc:
        logger.warning("JWKS client init attempt %d/3 failed: %s", _attempt, exc)
        if _attempt < 3:
            time.sleep(_attempt * 2)

if jwks_client is None:
    logger.critical("Impossible d'initialiser le JWKS client après 3 tentatives.")

def verify_token(token:str) -> str:
    if jwks_client is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Service d'authentification indisponible")
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
