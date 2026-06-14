# Task Ticket: Add Backend JWT Authorization (Fix IDOR)

**Priority:** P1 (Security)
**Owner:** Anyone with `CLERK_SECRET_KEY` access
**Depends on:** None
**Branch:** `fix/backend-auth-idor` (off `main`, one PR — never mix with feature work)

---

## Problem

All backend API routes accept `clerk_user_id` as a URL path parameter with **zero verification** that the caller owns that ID. This is an Insecure Direct Object Reference (IDOR) vulnerability.

Any authenticated user can read or mutate **any other user's data** by guessing their `clerk_user_id`:

```
GET  /api/readiness/{any_clerk_user_id}    → reads their readiness data
POST /api/readiness/seed/{any_clerk_user_id} → seeds their readiness data
```

The same pattern applies to future endpoints that take a `clerk_user_id` param.

### Affected endpoints

| Method | Route | File |
|--------|-------|------|
| POST | `/api/readiness/seed/{clerk_user_id}` | `backend/app/routes/readiness.py` |
| GET | `/api/readiness/{clerk_user_id}` | `backend/app/routes/readiness.py` |
| POST | `/api/health/seed/{clerk_user_id}` | `backend/app/routes/health.py` |
| GET | `/api/health/{clerk_user_id}` | `backend/app/routes/health.py` |

---

## Solution

Use the **Clerk Python SDK** to verify the session token on each request. No new env vars needed — the `CLERK_SECRET_KEY` already exists in `backend/.env.example`.

### Architecture

```
Browser (has Clerk session)
  │
  ├── Next.js pages (ClerkProvider already provides session)
  │     └── API calls via fetch()
  │           └── Include `Authorization: Bearer <session_token>` header
  │
  └── FastAPI backend
        ├── Clerk SDK verifies the JWT token using CLERK_SECRET_KEY
        ├── Dependency extracts verified clerk_user_id
        └── Route handlers: Use verified ID, not path param
```

### How It Works

1. Frontend gets a session token from Clerk: `await window.Clerk.session.getToken()`
2. Frontend sends it as `Authorization: Bearer <token>` in every API call
3. Backend uses Clerk SDK to verify the token with `CLERK_SECRET_KEY`
4. If valid, the SDK returns the user ID. If not, we return 401.
5. Route handlers use the verified user ID — no trusting URL params.

### Why Clerk SDK Instead of JWKS

The JWKS approach (fetching public keys from Clerk's JWKS endpoint) works, but it's more complex:
- Requires `PyJWT + cryptography + httpx` (3 dependencies)
- Needs a JWKS URL env var
- Needs to manage key caching and refresh

The **Clerk Python SDK** wraps all of that and uses your existing `CLERK_SECRET_KEY`:
- Single dependency: `clerk-sdk-python`
- No new env vars needed
- Simpler code (2 lines vs 20 lines)
- Clerk manages key rotation internally

---

## Implementation Steps

#### Step 1: Install Clerk Python SDK

```bash
cd backend
pip install clerk-sdk-python
```

If a `requirements.txt` exists, add `clerk-sdk-python` to it.

#### Step 2: Create `backend/app/auth/__init__.py`

```python
# Package init — empty file
```

#### Step 3: Create `backend/app/auth/verify.py`

Responsible for:
- Initializing the Clerk client with `CLERK_SECRET_KEY`
- Verifying the session token from the `Authorization` header
- Raising `HTTPException(401)` for invalid/missing tokens

```python
import os

from clerk import Clerk
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Init Clerk client with secret key from env
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise RuntimeError("CLERK_SECRET_KEY environment variable is not set")

clerk = Clerk(api_key=CLERK_SECRET_KEY)
security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> str:
    """
    Verify the Clerk session token and return the clerk_user_id (sub claim).
    Raises 401 if token is missing, expired, or invalid.
    """
    try:
        session = clerk.sessions.verify_token(credentials.credentials)
        if not session or "user_id" not in session:
            raise HTTPException(status_code=401, detail="Invalid session")
        return session["user_id"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

#### Step 4: Wire into Route Handlers

**Before (vulnerable):**

```python
@router.get("/{clerk_user_id}", response_model=ReadinessResponse)
def get_readiness(clerk_user_id: str):
    # Uses URL param directly — anyone can supply any ID
    ...
```

**After (secured) — BEST approach: remove clerk_user_id from URL entirely:**

```python
from app.auth.verify import get_current_user

@router.get("", response_model=ReadinessResponse)
def get_readiness(
    verified_user_id: str = Security(get_current_user),
):
    # verified_user_id comes from the JWT — no IDOR possible
    ...
```

**Alternative — verify the URL param matches the token:**

```python
@router.get("/{clerk_user_id}", response_model=ReadinessResponse)
def get_readiness(
    clerk_user_id: str,
    verified_user_id: str = Security(get_current_user),
):
    if clerk_user_id != verified_user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    ...
```

#### Step 5: Update All Routes

Remove `{clerk_user_id}` from path. Use `Depends(get_current_user)` instead:

| Route | Current | After |
|-------|---------|-------|
| `POST /api/readiness/seed/{clerk_user_id}` | `clerk_user_id` from path | Remove path param, use `get_current_user` |
| `GET /api/readiness/{clerk_user_id}` | `clerk_user_id` from path | Remove path param, use `get_current_user` |
| `POST /api/health/seed/{clerk_user_id}` | `clerk_user_id` from path | Remove path param, use `get_current_user` |
| `GET /api/health/{clerk_user_id}` | `clerk_user_id` from path | Remove path param, use `get_current_user` |

#### Step 6: Update Frontend API Calls

Add the `Authorization` header to all backend fetch calls in `frontend/lib/api.ts`:

```typescript
// Before
const res = await fetch(`${API_BASE}/api/readiness/${id}`);

// After
const token = await window.Clerk?.session?.getToken();
const res = await fetch(`${API_BASE}/api/readiness/${id}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**Note:** The `{id}` in the URL is no longer a `clerk_user_id` — after Step 5, it might be `student_id` or the route might not take any ID at all (the backend gets it from the token). Update the URL pattern accordingly.

For the token, use Clerk's `useAuth()` hook:
```typescript
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();
const token = await getToken();
```

---

## Verification

1. **Manual test — signed-in user**: Log into the app, open the dashboard. Health and readiness data should load normally. Check browser devtools → Network tab → verify the `Authorization: Bearer <token>` header is being sent.
2. **Manual test — tampered request**: Open devtools, find a request to `/api/health/` or `/api/readiness/`, modify the `Authorization` header to a fake token, send it. Should get `401`.
3. **Manual test — logged-out user**: Sign out, try accessing the dashboard. Should show sign-in page (no API calls leak through).
4. **Test user A vs B** (bonus): Create two accounts. Verify user A's data isn't visible when logged in as user B.

---

## Files Changed

| File | Change |
|------|--------|
| `backend/app/auth/__init__.py` | **New** — Empty package init |
| `backend/app/auth/verify.py` | **New** — Clerk SDK token verification + `get_current_user` dependency |
| `backend/app/routes/readiness.py` | **Modify** — Remove `{clerk_user_id}` from paths, add `Security(get_current_user)` |
| `backend/app/routes/health.py` | **Modify** — Remove `{clerk_user_id}` from paths, add `Security(get_current_user)` |
| `backend/requirements.txt` | **Modify** — Add `clerk-sdk-python` (or create this file if it doesn't exist) |
| `frontend/lib/api.ts` | **Modify** — Add `Authorization: Bearer <token>` header to all backend fetch calls |

**No new env vars needed.** `CLERK_SECRET_KEY` already exists in `backend/.env.example`.

---

## Risks / Uncertainties

- **No `requirements.txt` exists yet** — The backend has no dependency file. This task will need to create one (or at least document what to `pip install`). Add `clerk-sdk-python`, `fastapi`, `sqlalchemy`, `uvicorn`, `psycopg2-binary`, `python-dotenv` to it.
- **`clerk-sdk-python` API may differ** — The above code uses the SDK as documented, but the exact method name (`verify_token`) and response shape should be confirmed against the actual SDK docs. Run a quick test after installing.
- **`CLERK_SECRET_KEY` is already in `backend/.env.example`** — No new env var, but confirm the key works with the Clerk SDK by running a quick token verification in a test script.
- **Frontend token refresh** — Clerk's `getToken()` auto-refreshes expired tokens, but verify the frontend code calls it on every API request (not caching a stale token).
- **Frontend URL patterns change** — Since routes no longer take `clerk_user_id` in the URL, the frontend fetch URLs need to be updated (e.g., `/api/readiness/some-id` → `/api/readiness`).
