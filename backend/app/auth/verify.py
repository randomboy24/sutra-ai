import os

from clerk import Client
from clerk.errors import ClerkAPIException, NoActiveSessionException
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise RuntimeError("CLERK_SECRET_KEY environment variable is not set")

clerk = Client(token=CLERK_SECRET_KEY)
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
) -> str:
    """Verify the Clerk session token and return the clerk_user_id.

    Raises 401 if the token is missing, expired, or invalid.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        session = await clerk.verification.verify(credentials.credentials)
        return session.user_id
    except (ClerkAPIException, NoActiveSessionException):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
