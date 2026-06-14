import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError

load_dotenv()

security_scheme = HTTPBearer(auto_error=False)
_jwks_client: PyJWKClient | None = None
_jwks_url: str | None = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security_scheme),
) -> str:
    """Verify the Clerk session token and return the clerk_user_id.

    Raises 401 if the token is missing, expired, or invalid.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    try:
        return _verify_session_jwt(credentials.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except PyJWKClientError:
        raise HTTPException(status_code=401, detail="Unable to verify Clerk token")


def _verify_session_jwt(token: str) -> str:
    jwks_client = _get_jwks_client()
    signing_key = jwks_client.get_signing_key_from_jwt(token).key
    payload = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        issuer=os.getenv("CLERK_ISSUER") or None,
        options={"verify_aud": False},
    )

    authorized_parties = _get_authorized_parties()
    authorized_party = payload.get("azp")
    if authorized_party and authorized_parties and authorized_party not in authorized_parties:
        raise InvalidTokenError("Invalid authorized party")

    if payload.get("sts") == "pending":
        raise InvalidTokenError("Session is pending")

    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError("Missing subject")

    return user_id


def _get_jwks_client() -> PyJWKClient:
    global _jwks_client, _jwks_url

    jwks_url = os.getenv("CLERK_JWKS_URL")
    if not jwks_url:
        raise HTTPException(status_code=500, detail="Clerk JWKS URL is not configured")

    if _jwks_client is None or _jwks_url != jwks_url:
        _jwks_client = PyJWKClient(jwks_url)
        _jwks_url = jwks_url

    return _jwks_client


def _get_authorized_parties() -> set[str]:
    configured = os.getenv("CLERK_AUTHORIZED_PARTIES") or os.getenv("BACKEND_CORS_ORIGINS", "")
    return {origin.strip() for origin in configured.split(",") if origin.strip()}
