import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx

load_dotenv()

security_scheme = HTTPBearer(auto_error=False)
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_API_BASE = "https://api.clerk.com/v1"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not CLERK_SECRET_KEY:
        raise HTTPException(
            status_code=500, detail="Clerk secret key is not configured"
        )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{CLERK_API_BASE}/sessions/verify",
                headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
                json={"token": credentials.credentials},
                timeout=10.0,
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=503, detail="Authentication service timed out")
    except httpx.RequestError:
        raise HTTPException(
            status_code=503, detail="Authentication service unavailable"
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    body = resp.json()
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session data")

    return user_id
