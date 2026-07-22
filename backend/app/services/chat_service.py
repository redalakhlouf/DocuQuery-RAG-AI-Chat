import logging
import itertools
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatService:

    def __init__(self):
        self._key_cycle = None

    def _get_next_key(self) -> str:
        keys = settings.llm_api_keys
        if not keys:
            raise Exception("Aucune clé API LLM configurée")
        if self._key_cycle is None:
            self._key_cycle = itertools.cycle(keys)
        return next(self._key_cycle)

    async def call_llm(self, prompt: str) -> str:
        keys = settings.llm_api_keys
        last_error = None

        for _ in range(len(keys)):
            api_key = self._get_next_key()
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "llama-3.1-8b-instant",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.3,
                            "max_tokens": 1024
                        },
                        timeout=30.0
                    )

                    if response.status_code == 429:
                        logger.warning(f"Groq rate limit on key ...{api_key[-8:]}, rotating")
                        last_error = "Rate limit"
                        continue

                    if response.status_code != 200:
                        logger.error(f"Groq API error: {response.status_code} - {response.text}")
                        raise Exception("Erreur lors de la génération de la réponse")

                    data = response.json()
                    return data["choices"][0]["message"]["content"]

            except httpx.TimeoutException:
                logger.warning(f"Groq timeout on key ...{api_key[-8:]}, rotating")
                last_error = "Timeout"
                continue

        raise Exception("Toutes les clés API ont épuisé leur quota. Réessayez dans quelques secondes.")


chat_service = ChatService()
