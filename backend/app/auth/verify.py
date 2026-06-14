import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions

load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_JWT_KEY = os.getenv("CLERK_JWT_KEY")
AUTHORIZED_PARTIES = (
    os.getenv("CLERK_AUTHORIZED_PARTIES", "http://localhost:3000").split(",")
    if os.getenv("CLERK_AUTHORIZED_PARTIES")
    else ["http://localhost:3000"]
)

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security_scheme)
    ],
) -> str:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not CLERK_SECRET_KEY:
        raise HTTPException(
            status_code=500, detail="Clerk secret key is not configured"
        )

    try:
        state = authenticate_request(
            request,
            AuthenticateRequestOptions(
                secret_key=CLERK_SECRET_KEY,
                jwt_key=CLERK_JWT_KEY,
                authorized_parties=AUTHORIZED_PARTIES,
                accepts_token=["session_token"],
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not state.is_signed_in:
        reason = str(state.reason) if state.reason else "Invalid or expired session"
        raise HTTPException(status_code=401, detail=reason)

    user_id = state.payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session data")

    return user_id
