import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatService:

    async def call_llm(self, prompt: str) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.LLM_API_KEY}",
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

            if response.status_code != 200:
                # SECURITY: Logger l'erreur complète, ne PAS exposer au client
                logger.error(f"Groq API error: {response.status_code} - {response.text}")
                raise Exception("Erreur lors de la génération de la réponse")

            data = response.json()
            return data["choices"][0]["message"]["content"]


chat_service = ChatService()
