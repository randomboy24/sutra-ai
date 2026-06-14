# Sutra AI — Backend Architecture Document

> **Document Type:** Engineering Architecture Deep-Dive  
> **Audience:** Senior Engineers, System Designers, New Contributors  
> **Version:** 1.0  
> **Last Updated:** 2026-06-13  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure Map](#3-project-structure-map)
4. [Module Architecture](#4-module-architecture)
5. [API Routes Reference](#5-api-routes-reference)
6. [Database Design](#6-database-design)
7. [Webhook Processing Pipeline](#7-webhook-processing-pipeline)
8. [Authentication Architecture](#8-authentication-architecture)
9. [Key Design Patterns](#9-key-design-patterns)
10. [Planned Backend Features](#10-planned-backend-features)
11. [Build & Deployment](#11-build--deployment)
12. [Contributor Guidelines](#12-contributor-guidelines)
13. [Placeholder Inventory](#13-placeholder-inventory)

---

## 1. System Overview

```mermaid
flowchart LR
    subgraph External["External Systems"]
        Clerk["Clerk Auth"]
        FE["Next.js Frontend"]
    end
    
    subgraph Backend["FastAPI Backend"]
        API["API Server<br/>(port 8000)"]
        WH["Webhook Handler<br/>/webhooks/clerk"]
        AuthStubs["Auth Stubs<br/>/auth/login, /auth/register"]
    end
    
    subgraph Data["Data Layer"]
        ORM["SQLAlchemy ORM"]
        DB[("PostgreSQL")]
        Migrations["SQL Migrations"]
    end
    
    Clerk -->|"user.created webhook"| WH
    FE -->|"HTTP requests"| API
    WH -->|"Create/Update"| ORM
    ORM -->|"Persist"| DB
    Migrations -->|"Schema changes"| DB
```

### Core Responsibilities

1. **User Lifecycle Management** — Persist users and student profiles from Clerk webhooks
2. **Webhook Verification** — Validate Clerk webhook signatures via Svix
3. **API Serving** — FastAPI server with route stubs for future features
4. **Data Persistence** — PostgreSQL storage via SQLAlchemy ORM
5. **Onboarding Validation** — Server-side verification of student onboarding completeness

### Current Status

| Capability | Status | Notes |
|-----------|--------|-------|
| Webhook ingestion | ✅ Working | `user.created` handled idempotently |
| User persistence | ✅ Working | Users + Students tables |
| Onboarding validation | ✅ Working | Server-side derivation |
| Auth API stubs | ⬜ Stub | `/auth/login` and `/auth/register` return dummy data |
| Mock exam API | ⬜ Planned | Next feature slice |
| Question bank API | ⬜ Planned | PYQ storage and retrieval |
| Agentic layer | ⬜ Planned | Weakness detection, planning, interventions |

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI | High-performance async Python web framework |
| **ORM** | SQLAlchemy 2.x (DeclarativeBase) | Database interaction with Mapped types |
| **Database** | PostgreSQL | Primary data store |
| **Auth** | Clerk (webhook-based) | User lifecycle management |
| **Webhook Verification** | Svix | Cryptographic webhook signature validation |
| **Environment** | python-dotenv | Environment variable loading |
| **Runtime** | Uvicorn | ASGI server |
| **Python** | 3.x (via `.venv`) | Language runtime |

### Notable Absences

| Expected | Status | Impact |
|----------|--------|--------|
| `requirements.txt` / `pyproject.toml` | ❌ Missing | Dependencies are implicit; install via pip freeze or manual tracking |
| Alembic migrations | ❌ Missing | Schema changes use raw SQL files in `migrations/` |
| Pydantic schemas | ❌ Empty placeholders | Request/response validation uses raw dicts |
| Test suite | ❌ Missing | No pytest infrastructure |
| Docker/Compose | ❌ Missing | Local dev assumes direct PostgreSQL |

---

## 3. Project Structure Map

```
backend/
├── .env.example                     # Environment template
├── .gitignore                       # Python/git ignore patterns
│
└── app/
    ├── __init__.py                  # Package init — re-exports User, Student
    ├── main.py                      # FastAPI application entry point
    ├── database.py                  # SQLAlchemy engine, session, Base class
    ├── create_tables.py             # Utility: runs Base.metadata.create_all()
    ├── test_db.py                   # Utility: tests DB connectivity (SELECT 1)
    │
    ├── models/
    │   ├── __init__.py              # Exports: User, Student
    │   ├── user.py                  # User SQLAlchemy model
    │   └── student.py               # Student SQLAlchemy model
    │
    ├── routes/
    │   ├── auth.py                  # Auth stubs (login, register)
    │   ├── student.py               # EMPTY — placeholder for student CRUD
    │   └── webhooks.py              # Clerk webhook handler (WORKING)
    │
    └── schemas/
        └── student.py               # EMPTY — placeholder for Pydantic schemas
```

### File Count Summary

| Category | Count | Status |
|----------|-------|--------|
| Python modules | 10 | Various |
| SQL migrations | 1 | Applied |
| Config files | 2 | `.env.example`, `.gitignore` |
| **Total** | **13** | |

### Module Dependency Graph

```mermaid
graph TD
    main["main.py"] --> auth_router["routes/auth.py"]
    main --> webhooks_router["routes/webhooks.py"]
    
    webhooks --> database["database.py"]
    webhooks --> user_model["models/user.py"]
    webhooks --> student_model["models/student.py"]
    
    models_init["models/__init__.py"] --> user_model
    models_init --> student_model
    
    user_model --> database
    student_model --> database
    
    create_tables["create_tables.py"] --> database
    create_tables --> models_init
    
    test_db["test_db.py"] --> database
    
    app_init["app/__init__.py"] --> models_init
```

---

## 4. Module Architecture

### 4.1 Entry Point (`main.py`)

```python
app = FastAPI()
app.include_router(auth_router)      # /auth/*
app.include_router(webhooks_router)  # /webhooks/*

@app.get("/")                        # Health check
def root():
    return {"message": "Hello World"}
```

**Design Decisions:**
- No API prefix — auth uses `/auth/`, webhooks uses `/webhooks/`
- `load_dotenv()` called before any other initialization
- Routers are imported directly (no `routes/__init__.py`)

### 4.2 Database Layer (`database.py`)

```python
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = DeclarativeBase()
```

**Key characteristics:**
- Single engine, single session factory
- No connection pooling configuration (uses SQLAlchemy defaults)
- `autoflush=False` — explicit flush control
- `Base` extends `DeclarativeBase` (SQLAlchemy 2.0 style)
- `DATABASE_URL` format: `postgresql+psycopg://user:pass@host:5432/dbname`

### 4.3 Models Layer (`models/`)

#### User Model (`models/user.py`)

```python
class User(Base):
    __tablename__ = "users"
    id: str (PK, UUID4, String(36))
    clerk_user_id: str (Unique, Indexed, NotNull)
    email: str (Unique, Indexed, NotNull)
    role: str (NotNull)
    student: relationship("Student", back_populates="user", uselist=False)  # One-to-one
```

#### Student Model (`models/student.py`)

```python
class Student(Base):
    __tablename__ = "students"
    id: str (PK, UUID4, String(36))
    user_id: str (FK → users.id, Unique, NotNull)
    full_name: str
    is_individual: bool (default True)
    institute_id: str | None
    class_level: str | None   # "10th" or "12th"
    board: str | None          # "CBSE"
    stream: str | None         # "science" or "commerce"
    science_group: str | None  # "pcb", "pcm", "pcmb"
    onboarding_complete: bool (default False)
    user: relationship("User", back_populates="student")
```

### 4.4 Routes Layer (`routes/`)

- **No `__init__.py`** — routers are imported by filename directly in `main.py`
- **`auth.py`** — Stub router returning dummy login/register responses
- **`student.py`** — Empty file (placeholder)
- **`webhooks.py`** — Full Clerk webhook implementation (see §7)

### 4.5 Schemas Layer (`schemas/`)

- **`student.py`** — Empty file (placeholder for `pydantic.BaseModel` schemas)
- **No `__init__.py`** — not importable as a package

### 4.6 Utility Modules

| Module | Purpose |
|--------|---------|
| `create_tables.py` | `Base.metadata.create_all(bind=engine)` — creates all tables from model definitions |
| `test_db.py` | `engine.connect()` → `SELECT 1` — verifies DB reachability |

---

## 5. API Routes Reference

### 5.1 Current Routes

| Method | Path | Handler | Status | Description |
|--------|------|---------|--------|-------------|
| GET | `/` | `root()` | ✅ **Working** | Health check, returns `{"message": "Hello World"}` |
| POST | `/auth/login` | `login()` | ⬜ **Stub** | Returns `{"message": "Login successful"}` |
| POST | `/auth/register` | `register()` | ⬜ **Stub** | Returns `{"message": "Registration successful"}` |
| POST | `/webhooks/clerk` | `clerk_webhook()` | ✅ **Working** | Handles Clerk `user.created` events |

### 5.2 Route Diagram

```mermaid
flowchart LR
    Client["HTTP Client"]
    API["FastAPI (port 8000)"]
    
    API -->|"GET /"| Root["root()<br/>→ Hello World"]
    API -->|"POST /auth/login"| Login["login()<br/>→ stub response"]
    API -->|"POST /auth/register"| Register["register()<br/>→ stub response"]
    API -->|"POST /webhooks/clerk"| Webhook["clerk_webhook()<br/>→ user+student persistence"]
    
    Webhook --> Verify["Svix Signature<br/>Verification"]
    Verify --> Extract["Extract metadata<br/>from unsafe_metadata"]
    Extract --> Persist["Upsert User<br/>+ Student row"]
    Persist --> DB[("PostgreSQL")]
```

### 5.3 Webhook Request/Response Contract

**Request** (from Clerk):
```json
{
  "type": "user.created",
  "data": {
    "id": "clerk_user_123",
    "email_addresses": [{"email_address": "student@example.com"}],
    "first_name": "John",
    "unsafe_metadata": {
      "role": "student",
      "student_type": "individual",
      "class_level": "12th",
      "board": "CBSE",
      "stream": "science",
      "science_group": "pcm",
      "onboarding_complete": true
    }
  }
}
```

**Response** (success):
```json
{ "success": true }
```

**Response** (error):
```json
{ "detail": "Invalid webhook signature" }  // 400
{ "detail": "Webhook processing failed" }   // 500
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| students : has
    
    users {
        string id PK "UUID v4"
        string clerk_user_id UK "Clerk user ID"
        string email UK "User email"
        string role "student | admin | teacher"
    }
    
    students {
        string id PK "UUID v4"
        string user_id FK "→ users.id"
        string full_name "Student name"
        boolean is_individual "true = individual, false = institute"
        string institute_id "Nullable - for institute accounts"
        string class_level "10th | 12th"
        string board "CBSE | GSEB | ICSE"
        string stream "science | commerce"
        string science_group "pcb | pcm | pcmb"
        boolean onboarding_complete "Server-validated"
    }
```

### 6.2 Table Definitions

**`users`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | VARCHAR(36) | PK | UUID4, generated at insert |
| clerk_user_id | VARCHAR | UNIQUE, NOT NULL, INDEXED | Maps to Clerk identity |
| email | VARCHAR | UNIQUE, NOT NULL, INDEXED | Primary contact email |
| role | VARCHAR | NOT NULL | Determines access level |

**`students`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | VARCHAR(36) | PK | UUID4 |
| user_id | VARCHAR(36) | FK → users.id, UNIQUE, NOT NULL | One-to-one with User |
| full_name | VARCHAR | NOT NULL | From Clerk first_name |
| is_individual | BOOLEAN | DEFAULT TRUE | Individual vs. institute |
| institute_id | VARCHAR | NULLABLE | Future use |
| class_level | VARCHAR | NULLABLE | "10th" or "12th" |
| board | VARCHAR | NULLABLE | "CBSE" (GSEB/ICSE coming soon) |
| stream | VARCHAR | NULLABLE | "science" or "commerce" |
| science_group | VARCHAR | NULLABLE | "pcb", "pcm", or "pcmb" |
| onboarding_complete | BOOLEAN | NOT NULL DEFAULT FALSE | Server-derived, not trusted from client |

### 6.3 Migration History

| File | Description | Status |
|------|-------------|--------|
| `001_add_student_onboarding_fields.sql` | Add `class_level`, `board`, `stream`, `science_group`, `onboarding_complete` to `students` | ✅ Applied |

### 6.4 Migration SQL

```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS class_level VARCHAR,
ADD COLUMN IF NOT EXISTS board VARCHAR,
ADD COLUMN IF NOT EXISTS stream VARCHAR,
ADD COLUMN IF NOT EXISTS science_group VARCHAR,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
```

**Note:** No Alembic or migration framework — raw SQL files manually applied.

### 6.5 Planned Tables (from README)

These tables are sketched in the product roadmap but not yet implemented:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `question_sources` | Origin of questions (exam, year, board) | name, year, board |
| `questions` | Individual question records | prompt, source_id, difficulty |
| `question_options` | Multiple choice options | question_id, text, is_correct |
| `question_occurrences` | Exam appearances | question_id, source_id, year |
| `question_tags` | Conceptual tags/topics | question_id, tag_name |
| `mock_attempts` | Student exam attempts | student_id, started_at, score |
| `mock_attempt_answers` | Individual answer records | attempt_id, question_id, selected_option |
| `student_weaknesses` | Detected weak areas | student_id, concept, severity |

---

## 7. Webhook Processing Pipeline

### 7.1 End-to-End Flow

```mermaid
sequenceDiagram
    participant Clerk
    participant FastAPI as FastAPI /webhooks/clerk
    participant Svix as Svix Verifier
    participant DB as PostgreSQL
    
    Clerk->>FastAPI: POST /webhooks/clerk (signed payload)
    FastAPI->>Svix: Verify webhook signature
    Svix-->>FastAPI: ✅ Valid / ❌ Invalid
    
    alt Invalid Signature
        FastAPI-->>Clerk: 400 Bad Request
    end
    
    FastAPI->>FastAPI: Parse event type
    
    alt Not user.created
        FastAPI-->>Clerk: 200 { success: true } (ignore)
    end
    
    FastAPI->>FastAPI: Extract unsafe_metadata
    
    Note over FastAPI: Derive onboarding_complete<br/>server-side (don't trust client flag)
    
    FastAPI->>DB: Query existing user by clerk_user_id
    
    alt User Exists
        FastAPI->>DB: Update user if needed
    else New User
        FastAPI->>DB: INSERT user record
    end
    
    alt Role == "student"
        FastAPI->>DB: Query existing student by user_id
        
        alt Student Exists
            FastAPI-->>Clerk: 200 (skip)
        else New Student
            FastAPI->>DB: INSERT student record with onboarding fields
        end
    end
    
    FastAPI-->>Clerk: 200 { success: true }
```

### 7.2 Idempotency Guarantees

The webhook handler is **idempotent** for retry scenarios:

1. **User exists, student missing** → Creates student row (handles partial retry)
2. **User exists, student exists** → No-op, returns success
3. **User missing** → Creates user + student atomically
4. **DB error** → Rolls back transaction, returns 500 (Clerk will retry)

### 7.3 Onboarding Validation Logic

```python
def is_student_onboarding_complete(
    student_type,
    class_level,
    board,
    stream,
    science_group,
) -> bool:
    # 1. Must be individual student
    if student_type != "individual": return False
    # 2. Valid class and board
    if class_level not in {"10th", "12th"}: return False
    if board not in {"CBSE"}: return False
    # 3. Valid stream
    if stream not in {"science", "commerce"}: return False
    # 4. Commerce is complete
    if stream == "commerce": return True
    # 5. Science requires valid group
    return science_group in {"pcb", "pcm", "pcmb"}
```

**Security note:** The backend derives `onboarding_complete` from allowed values rather than trusting the client's `unsafeMetadata.onboarding_complete` flag. This prevents malicious clients from bypassing the onboarding flow.

---

## 8. Authentication Architecture

### 8.1 Current Auth Strategy

```mermaid
flowchart LR
    subgraph "Frontend (Next.js)"
        SignUp["Custom Signup +<br/>Onboarding Wizard"]
        SignIn["Clerk SignIn Component"]
        Proxy["Clerk Middleware<br/>/dashboard(.*) protection"]
    end
    
    subgraph "Clerk Cloud"
        AuthAPI["Auth API"]
        Session["Session Management"]
        Webhook["Webhook Dispatch"]
    end
    
    subgraph "Backend (FastAPI)"  
        WHHandler["Webhook Handler"]
        JWT["Future: JWT Verification"]
    end
    
    SignUp --> AuthAPI
    SignIn --> AuthAPI
    AuthAPI --> Session
    AuthAPI --> Webhook
    Webhook --> WHHandler
    
    Proxy -.->|"Future"| JWT
```

### 8.2 Current vs. Planned Auth

| Aspect | Current | Planned |
|--------|---------|---------|
| Frontend auth | Clerk SDK (sign in/up) | Same |
| Route protection | Clerk middleware | Same |
| Backend auth | No auth on API | JWT verification from Clerk session |
| Webhook trust | Svix signature verification | Same |
| User data source | Clerk webhook | Same + direct API |

**Key gap:** The backend has **no authenticated API endpoints** yet. All current routes are either public health checks or webhooks (verified by Svix, not user sessions). Future APIs for mock exams, question banks, and agentic features will need Clerk JWT verification middleware.

---

## 9. Key Design Patterns

### 9.1 Session Management Pattern

```python
# Database session is created per-request in webhooks
db = SessionLocal()
try:
    # ... database operations ...
    db.commit()
except Exception:
    db.rollback()
    raise
finally:
    db.close()
```

**Observation:** No dependency injection or `Depends()` pattern — sessions are manually managed. Future refactoring should use FastAPI's `Depends(get_db)` for automatic session lifecycle.

### 9.2 Model Inheritance

Both models extend `Base` (the `DeclarativeBase` instance) and use SQLAlchemy 2.0's `Mapped` annotation style:

```python
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
```

### 9.3 UUID Primary Key Pattern

```python
def __init__(self):
    self.id = str(uuid4())  # Generated server-side for every model
```

UUIDs are stored as `VARCHAR(36)` strings rather than `UUID` native type — this is a pragmatic choice for readability but sacrifices some DB-level UUID optimization.

### 9.4 Configuration Pattern

```python
# All configuration comes from environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
CLERK_WEBHOOK_SECRET = os.environ["CLERK_WEBHOOK_SECRET"]  # Will raise KeyError if missing
```

- `os.getenv()` for optional values (DATABASE_URL)
- `os.environ[]` for required values (CLERK_WEBHOOK_SECRET)
- `.env` file loaded via `python-dotenv` at import time

### 9.5 Webhook Signature Verification

```python
from svix.webhooks import Webhook, WebhookVerificationError

event = Webhook(os.environ["CLERK_WEBHOOK_SECRET"]).verify(payload, headers)
```

Svix decodes the `svix-*` headers, verifies against the shared secret, and raises `WebhookVerificationError` on mismatch.

---

## 10. Planned Backend Features

### 10.1 Feature Backlog (from Product Roadmap)

```mermaid
flowchart TB
    Foundation["Auth + Onboarding ✅"] --> Mock["Mock Exam API"]
    Mock --> Attempts["Mock Attempts + Answers"]
    Attempts --> Weakness["Weakness Detection Agent"]
    Attempts --> Readiness["Exam Readiness Score"]
    Weakness --> QuestionBank["Personalized Question Bank"]
    Weakness --> Planner["Autonomous Study Planner"]
    Readiness --> Planner
    Planner --> Intervention["AI Intervention Engine"]
    QuestionBank --> Adaptive["Adaptive Exam Simulator"]
    Paper["AI Paper Evaluator"] --> Weakness
    Paper --> Readiness
```

### 10.2 Recommended Next Backend Slice

From the README, the recommended next step is **Weakness Detection foundation**:

1. **Question bank tables** — `question_sources`, `questions`, `question_options`, `question_tags`
2. **Mock attempt tables** — `mock_attempts`, `mock_attempt_answers`
3. **Submit mock result API** — POST `/api/mock/attempts` to persist results
4. **Weakness summary API** — GET `/api/weakness/{student_id}` returning identified gaps
5. **Dashboard integration** — Connect frontend widgets to real data

### 10.3 Database Schema for Next Phase

```sql
CREATE TABLE question_sources (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    board VARCHAR NOT NULL,
    exam_type VARCHAR NOT NULL
);

CREATE TABLE questions (
    id VARCHAR(36) PRIMARY KEY,
    source_id VARCHAR(36) REFERENCES question_sources(id),
    prompt TEXT NOT NULL,
    difficulty VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    chapter VARCHAR NOT NULL,
    unit VARCHAR
);

CREATE TABLE mock_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id),
    started_at TIMESTAMP NOT NULL,
    submitted_at TIMESTAMP,
    score DECIMAL(5,2)
);

CREATE TABLE student_weaknesses (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id),
    concept VARCHAR NOT NULL,
    severity DECIMAL(3,2) NOT NULL,
    detected_at TIMESTAMP NOT NULL
);
```

---

## 11. Build & Deployment

### 11.1 Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt  # NOTE: requirements.txt doesn't exist yet
uvicorn app.main:app --reload
```

### 11.2 Verification

```bash
# Compile check
python -m compileall app

# DB connectivity test
python -m app.test_db

# Create tables
python -m app.create_tables
```

### 11.3 Environment Variables

```env
# Required
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/dbname
CLERK_WEBHOOK_SECRET=whsec_...
```

### 11.4 Docker (Not Yet Implemented)

No Dockerfile or docker-compose.yml exists. The README references `docker-data/` and `postgres_data/` in `.gitignore`, suggesting Docker-based PostgreSQL was used during development but not committed.

---

## 12. Contributor Guidelines

### Do's
- Use SQLAlchemy 2.0 `Mapped` annotation style for new models
- Add Pydantic schemas for request/response validation on new endpoints
- Use FastAPI `Depends()` for session management in new routes
- Use `__init__.py` files in new route/schema packages
- Create Alembic migrations for schema changes (migrate from raw SQL)
- Add comprehensive error handling with specific HTTP status codes

### Don'ts
- Don't trust Clerk `unsafeMetadata` for authorization decisions
- Don't commit real `.env` secrets
- Don't skip webhook signature verification
- Don't use synchronous DB calls in async route handlers (use `run_in_executor` or async SQLAlchemy)
- Don't add features without corresponding database models and migrations

### Refactoring Priorities

1. **Create `requirements.txt`** — Pin all Python dependencies
2. **Add Pydantic schemas** — Replace raw dict handling with validated schemas
3. **Implement dependency injection** — Use FastAPI `Depends(get_db)` for sessions
4. **Add Clerk JWT verification** — Middleware for authenticated API endpoints
5. **Set up Alembic** — Structured migration system replacing raw SQL
6. **Add tests** — pytest + test database fixture
7. **Split webhook handler** — Extract business logic from route handler

---

## 13. Placeholder Inventory

| File/Route | Type | Expected Future Content |
|------------|------|------------------------|
| `routes/auth.py` | Stub | Real JWT-based auth or Clerk JWT verification |
| `routes/student.py` | Empty file | Student profile CRUD, analytics endpoints |
| `schemas/student.py` | Empty file | Pydantic models: `StudentCreate`, `StudentResponse`, `OnboardingMetadata` |
| `routes/__init__.py` | Missing | Router aggregation, middleware |
| `schemas/__init__.py` | Missing | Schema re-exports |
| `requirements.txt` | Missing | All Python package dependencies |
| Alembic setup | Missing | Structured migration management |
| Test suite | Missing | pytest infrastructure |

---

## Appendix A: Full File Inventory

| File | Size (lines) | Purpose | Status |
|------|-------------|---------|--------|
| `backend/.env.example` | 2 | Environment template | Template |
| `backend/.gitignore` | 6 | Git ignore patterns | Complete |
| `backend/app/__init__.py` | 3 | Package init, re-exports | Complete |
| `backend/app/main.py` | 15 | FastAPI entry point | **Needs expansion** |
| `backend/app/database.py` | 20 | SQLAlchemy setup | Complete |
| `backend/app/create_tables.py` | 4 | Table creation utility | Complete |
| `backend/app/test_db.py` | 9 | DB connectivity test | Complete |
| `backend/app/models/__init__.py` | 4 | Model exports | Complete |
| `backend/app/models/user.py` | 40 | User model | Complete |
| `backend/app/models/student.py` | 67 | Student model | Complete |
| `backend/app/routes/auth.py` | 13 | Auth stubs | **Stub** |
| `backend/app/routes/student.py` | 0 | Student routes | **Empty** |
| `backend/app/routes/webhooks.py` | 142 | Clerk webhook handler | **Working** |
| `backend/app/schemas/student.py` | 0 | Pydantic schemas | **Empty** |
| `backend/migrations/001_add_student_onboarding_fields.sql` | 8 | Database migration | **Applied** |

## Appendix B: Key Metrics

| Metric | Value |
|--------|-------|
| Total Python files | 14 |
| Total lines of code | ~333 |
| API endpoints (working) | 2 (health + webhook) |
| API endpoints (stub) | 2 (login + register) |
| Database tables | 2 (users + students) |
| Database migrations | 1 (raw SQL) |
| External integrations | 2 (Clerk + Svix) |

---

> **End of Backend Architecture Document**  
> For frontend architecture, see `openclaude_frontend.md`  
> For merged full-system architecture, see `openclaude_both_repo.md`
