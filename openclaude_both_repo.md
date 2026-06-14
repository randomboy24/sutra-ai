# Sutra AI — Full-System Architecture Document

> **Document Type:** VP of Engineering — System Architecture Deep-Dive  
> **Audience:** Engineering Leadership, System Designers, Cross-Repo Contributors  
> **Version:** 1.0  
> **Last Updated:** 2026-06-13  

---

## Table of Contents

1. [Product Vision & Strategy](#1-product-vision--strategy)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [End-to-End Data Flow](#3-end-to-end-data-flow)
4. [Repository Map](#4-repository-map)
5. [Module Interaction Map](#5-module-interaction-map)
6. [Auth & Onboarding Pipeline](#6-auth--onboarding-pipeline)
7. [Mock Exam Pipeline (Current)](#7-mock-exam-pipeline-current)
8. [Planned System Evolution](#8-planned-system-evolution)
9. [Integration Points](#9-integration-points)
10. [Development Workflow](#10-development-workflow)
11. [Tech Debt & Known Gaps](#11-tech-debt--known-gaps)
12. [Architecture Decision Records](#12-architecture-decision-records)
13. [Getting Started for Contributors](#13-getting-started-for-contributors)

---

## 1. Product Vision & Strategy

### 1.1 The North Star

> **Sutra AI** is an autonomous academic success copilot — a system that continuously monitors student performance, detects weak concepts, rebuilds study plans, triggers interventions, and personalizes exam preparation — **without requiring human teachers to do the heavy lifting.**

### 1.2 Core Principles

1. **Autonomous** — The system acts proactively, not reactively
2. **Diagnostic** — Finds root causes, not just symptoms
3. **Adaptive** — Adjusts to each student's pace and gaps
4. **Board-Aligned** — Works with CBSE, ICSE, and state board curricula
5. **Agentic** — Multiple AI agents collaborate (health monitoring, weakness detection, planning, intervention)

### 1.3 Who Owns What

| Area | Owner | Status |
|------|-------|--------|
| Mock Exam UI + Flow | **Shared** | ✅ Active |
| Weakness Detection Agent | **Jatin** | Next |
| AI Paper Evaluator | **Jatin** | Planned |
| AI Intervention Engine | **Jatin** | Planned |
| Adaptive Exam Simulator | **Jatin** | Planned |
| Academic Health Agent | **Krish** | Planned |
| Autonomous Study Planner | **Krish** | Planned |
| Exam Readiness Score | **Krish** | Planned |
| Personalized Question Bank | **Krish** | Planned |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph "Client Layer"
        Browser["Student Browser"]
    end
    
    subgraph "Frontend (Next.js 16)"
        Pages["App Router Pages<br/>/, /auth, /dashboard, /mock-exam"]
        Components["React Components<br/>Auth, Dashboard, Mock Exam,<br/>Marketing Pages"]
        State["Client State<br/>Theme, Exam, UI State"]
        ClerkSDK["Clerk SDK<br/>SignIn/SignUp, Session"]
    end
    
    subgraph "Auth Layer"
        Clerk["Clerk Cloud<br/>Auth + User Mgmt"]
        Webhook["Webhook Dispatch<br/>user.created"]
    end
    
    subgraph "Backend (FastAPI)"
        WHHandler["Webhook Handler<br/>/webhooks/clerk"]
        AuthStubs["Auth Stubs<br/>/auth/login, /auth/register"]
        APIFuture["Future APIs<br/>Mock Exam, Question Bank,<br/>Agentic Features"]
    end
    
    subgraph "Data Layer"
        ORM["SQLAlchemy ORM<br/>User + Student Models"]
        DB[("PostgreSQL<br/>users + students tables")]
        Migrations["SQL Migrations<br/>001_onboarding_fields"]
    end
    
    subgraph "Planned AI Layer"
        Agent1["Academic Health Agent"]
        Agent2["Weakness Detection Agent"]
        Agent3["Study Planner Agent"]
        Agent4["Intervention Engine"]
        Agent5["Paper Evaluator"]
    end
    
    Browser --> Pages
    Pages --> Components
    Components --> ClerkSDK
    ClerkSDK --> Clerk
    Clerk -->|"Sign in/up"| ClerkSDK
    Clerk -->|"user.created"| Webhook
    Webhook --> WHHandler
    WHHandler --> ORM
    ORM --> DB
    
    Pages -->|"Future API calls"| APIFuture
    APIFuture --> ORM
    DB -.-> Agent1
    DB -.-> Agent2
    DB -.-> Agent3
    DB -.-> Agent4
    
    Agent2 -.-> APIFuture
    Agent3 -.-> APIFuture
    Agent4 -.-> APIFuture
```

### 2.2 Technology Overview

```mermaid
flowchart LR
    subgraph Frontend["Frontend Stack"]
        Next["Next.js 16"]
        React["React 19"]
        TS["TypeScript 5.8"]
        Tailwind["Tailwind CSS 4.1"]
        Motion["Motion (Framer)"]
        BaseUI["Base UI"]
        ClerkFE["@clerk/nextjs"]
        Lucide["lucide-react"]
        Shadcn["shadcn/ui"]
    end
    
    subgraph Backend["Backend Stack"]
        FastAPI["FastAPI"]
        SQLAlchemy["SQLAlchemy 2.0"]
        Postgres["PostgreSQL"]
        Svix["Svix (webhooks)"]
        Dotenv["python-dotenv"]
    end
    
    subgraph External["External Services"]
        ClerkAPI["Clerk API"]
    end
    
    ClerkFE --> ClerkAPI
    Svix --> ClerkAPI
    
    FastAPI --> SQLAlchemy
    SQLAlchemy --> Postgres
```

---

## 3. End-to-End Data Flow

### 3.1 Complete Data Flow Diagram

```mermaid
flowchart LR
    Student["Student Browser"]
    
    subgraph "Onboarding Flow"
        Landing["Marketing Page<br/>(/)"]
        Auth["Auth Page<br/>(/auth)"]
        Wizard["Onboarding Wizard<br/>6 Steps"]
        ClerkSignup["Clerk Signup<br/>+ unsafeMetadata"]
    end
    
    subgraph "Clerk Processing"
        ClerkCreate["Clerk User Creation"]
        EmailVerify["Email Verification"]
        WebhookDispatch["Webhook: user.created"]
    end
    
    subgraph "Backend Processing"  
        SigVerify["Svix Signature<br/>Verification"]
        ExtractMD["Extract unsafe_metadata"]
        Validate["Validate Onboarding<br/>Server-Side"]
        CreateUser["Create User Row"]
        CreateStudent["Create Student Row<br/>+ onboarding fields"]
    end
    
    subgraph "Dashboard Experience"
        Dashboard["Protected Dashboard<br/>(/dashboard)"]
        MockExam["Mock Exam Setup<br/>→ Select Subject/Chapter/Unit"]
        ExamSession["Fullscreen Exam<br/>Timer + Questions + Navigator"]
        Results["Results + Review<br/>Score + Explanations"]
    end
    
    subgraph "Data Storage"
        UserDB[("users table")]
        StudentDB[("students table")]
        LocalState["Browser State<br/>Theme, Exam Data"]
    end
    
    Student --> Landing
    Landing --> Auth
    Auth --> Wizard
    Wizard -->|unsafeMetadata| ClerkSignup
    ClerkSignup --> ClerkCreate
    ClerkCreate --> EmailVerify
    EmailVerify -->|"Session created"| Dashboard
    ClerkCreate --> WebhookDispatch
    
    WebhookDispatch --> SigVerify
    SigVerify --> ExtractMD
    ExtractMD --> Validate
    Validate --> CreateUser
    CreateUser --> CreateStudent
    CreateStudent --> StudentDB
    CreateUser --> UserDB
    
    Dashboard --> MockExam
    MockExam --> ExamSession
    ExamSession --> Results
    Results -->|"Client-side calc"| LocalState
    Results -.->|"Future: POST /api/attempts"| DB[(Future Tables)]
    
    StudentDB -.->|"Future: analytics"| Dashboard
```

### 3.2 Current Data Flow Limitations

| Aspect | Current State | Planned State |
|--------|---------------|---------------|
| Mock questions | Hardcoded in frontend (10 questions) | Served from backend question bank |
| Exam results | Calculated client-side, ephemeral | Persisted to `mock_attempts` table |
| User data | Only from Clerk webhook | Direct API queries |
| Dashboard metrics | Hardcoded placeholders | Real data from analytics APIs |
| Weakness detection | Not implemented | ML agents analyzing attempt data |

---

## 4. Repository Map

### 4.1 Root Structure

```
sutra-ai/
├── frontend/           # Next.js 16 application (~44 source files)
├── backend/            # FastAPI application (~14 Python files)
├── README.md           # Product & engineering documentation
├── sutra-ai-work-progress.md  # Feature tracking & status
├── Codebase-Prompt.txt        # Original documentation request
└── .git/               # Git repository
```

### 4.2 Cross-Repo File Map

| Frontend File | Backend Counterpart | Connection |
|--------------|-------------------|------------|
| `proxy.ts` (Clerk middleware) | `webhooks.py` (Clerk webhook) | Auth lifecycle |
| `app/auth/page.tsx` | `routes/webhooks.py` | Onboarding → persistence |
| `components/auth-page.tsx` | `models/student.py` | Metadata contract |
| `components/dashboard/mock-exam-dashboard.tsx` | (future) `routes/mock.py` | API integration needed |
| `app/layout.tsx` (ClerkProvider) | `database.py` | Session → data |

### 4.3 Key Integration Contracts

#### Metadata Contract (Frontend → Backend via Clerk)

```json
{
  "role": "student",
  "student_type": "individual",
  "class_level": "10th | 12th",
  "board": "CBSE",
  "stream": "science | commerce",
  "science_group": "pcb | pcm | pcmb",
  "onboarding_complete": true
}
```

This metadata is set by the frontend during Clerk signup, transmitted via Clerk's `unsafeMetadata`, delivered to the backend via webhook, and **re-validated server-side**.

#### API Contract (Future — Frontend → Backend)

```typescript
// Planned API shape
GET  /api/questions?subject=physics&chapter=electrostatics
     → { questions: Question[] }

POST /api/mock/attempts
     → { body: { studentId, questions, answers } }
     → { result: { score, correct, incorrect, skipped } }

POST /api/weakness/{studentId}
     → { weaknesses: [{ concept, severity }] }
```

---

## 5. Module Interaction Map

### 5.1 Frontend Module Dependencies

```mermaid
graph TD
    subgraph "Pages Layer"
        Root["/ (page.tsx)"]
        AuthPage["/auth (page.tsx)"]
        Dashboard["/dashboard (page.tsx)"]
        MockExam["/mock-exam (page.tsx)"]
    end
    
    subgraph "Auth Module"
        AuthComponent["auth-page.tsx<br/>SignIn + SignupWizard"]
        ClerkProvider["layout.tsx<br/>ClerkProvider"]
    end
    
    subgraph "Dashboard Module"
        DashComponent["mock-exam-dashboard.tsx<br/>MockExamDashboard"]
        MockFlow["mock-exam-dashboard.tsx<br/>MockExamFlow (exported)"]
    end
    
    subgraph "Marketing Module"
        Header
        Hero
        FeatureSection
        PricingSection
        Testimonials
        FAQ
        Contact
    end
    
    subgraph "UI Module"
        Button
        Input
        Avatar
        NavigationMenu
        ThemeToggle
        Logo
    end
    
    subgraph "Utility Module"
        Cn["cn() - lib/utils.ts"]
        UseTheme["use-theme.ts"]
        UseScroll["use-scroll.ts"]
    end
    
    Root --> Marketing
    AuthPage --> AuthComponent
    AuthComponent --> Button
    AuthComponent --> Input
    AuthComponent --> FloatingPaths
    
    Dashboard --> DashComponent
    DashComponent --> ThemeToggle
    DashComponent --> Button
    DashComponent --> Logo
    
    MockExam --> MockFlow
    
    Button --> Cn
    Input --> Cn
    ThemeToggle --> UseTheme
    Header --> UseScroll
```

### 5.2 Backend Module Dependencies

```mermaid
graph TD
    subgraph "Entry"
        Main["main.py"]
        Dotenv["load_dotenv()"]
    end
    
    subgraph "Routes"
        Webhooks["routes/webhooks.py"]
        AuthStubs["routes/auth.py"]
    end
    
    subgraph "Data Layer"
        Database["database.py<br/>engine, SessionLocal, Base"]
        UserModel["models/user.py"]
        StudentModel["models/student.py"]
    end
    
    subgraph "Utilities"
        CreateTables["create_tables.py"]
        TestDB["test_db.py"]
    end
    
    Main --> Webhooks
    Main --> AuthStubs
    Main --> Dotenv
    
    Webhooks --> Database
    Webhooks --> UserModel
    Webhooks --> StudentModel
    
    UserModel --> Database
    StudentModel --> Database
    
    CreateTables --> Database
    CreateTables --> UserModel
    CreateTables --> StudentModel
    
    TestDB --> Database
```

### 5.3 Cross-System Interaction

```mermaid
sequenceDiagram
    participant Student
    participant NextJS as Next.js Frontend  
    participant Clerk
    participant FastAPI as FastAPI Backend
    participant DB as PostgreSQL
    
    Note over Student,DB: === AUTH & ONBOARDING ===
    
    Student->>NextJS: Visit /auth
    NextJS->>Student: Show SignIn/SignUp choice
    Student->>NextJS: Choose Sign Up
    NextJS->>Student: Onboarding wizard (6 steps)
    Student->>NextJS: Submit onboarding data
    NextJS->>Clerk: signUp.create({ email, password, unsafeMetadata })
    Clerk->>Clerk: Create user, send verification email
    Student->>Clerk: Verify email with code
    Clerk->>NextJS: Session created, redirect to /dashboard
    Clerk->>FastAPI: Send user.created webhook
    FastAPI->>FastAPI: Verify Svix signature
    FastAPI->>FastAPI: Validate onboarding server-side
    FastAPI->>DB: INSERT user + student
    DB-->>FastAPI: Success
    FastAPI-->>Clerk: 200 OK
    
    Note over Student,DB: === MOCK EXAM (CURRENT - No Backend) ===
    
    Student->>NextJS: Click "Start Mock Exam"
    NextJS->>Student: Setup wizard (subject/chapter/units/length)
    Student->>NextJS: Confirm exam
    NextJS->>Student: Locked fullscreen exam (client-side)
    Student->>NextJS: Answer questions, submit
    NextJS->>Student: Show results + review (ephemeral)
    
    Note over Student,DB: === MOCK EXAM (PLANNED - With Backend) ===
    
    Student->>NextJS: Start mock exam
    NextJS->>FastAPI: GET /api/questions (filtered)
    FastAPI->>DB: Query question bank
    DB-->>FastAPI: Return questions
    FastAPI-->>NextJS: Return questions
    NextJS->>Student: Fullscreen exam
    Student->>NextJS: Submit answers
    NextJS->>FastAPI: POST /api/mock/attempts
    FastAPI->>DB: Save attempt + answers
    DB-->>FastAPI: Success
    FastAPI->>FastAPI: Run weakness detection
    FastAPI-->>NextJS: Return results + weaknesses
    NextJS->>Student: Show results + insights
    
    Student->>NextJS: View dashboard
    NextJS->>FastAPI: GET /api/dashboard/stats
    FastAPI->>DB: Aggregate student data
    DB-->>FastAPI: Stats
    FastAPI-->>NextJS: Real dashboard metrics
```

---

## 6. Auth & Onboarding Pipeline

### 6.1 Complete Auth Flow

```mermaid
flowchart TB
    Start["Student visits /auth"] --> Choice{"Has account?"}
    
    Choice -->|"No"| SignUp["Click Sign Up"]
    Choice -->|"Yes"| SignIn["Click Sign In"]
    
    SignIn --> ClerkSignIn["Clerk <SignIn /> Component"]
    ClerkSignIn -->|"Success"| Dashboard["Redirect to /dashboard"]
    
    SignUp --> Wizard["Onboarding Wizard"]
    
    Wizard --> Step1["Step 1: Account Type<br/>Student ✅ | Institute 🔜"]
    Step1 --> Step2["Step 2: Student Type<br/>Individual ✅ | Institute 🔜"]
    Step2 --> Step3["Step 3: Class Level<br/>10th ✅ | 12th ✅"]
    Step3 --> Step4["Step 4: Board<br/>CBSE ✅ | GSEB🔜 | ICSE🔜"]
    Step4 --> Step5["Step 5: Stream<br/>Science ✅ | Commerce ✅"]
    Step5 -->|"Science"| Step6["Step 6: Science Group<br/>PCB | PCM | PCMB"]
    Step5 -->|"Commerce"| Form["Credential Form"]
    Step6 --> Form
    
    Form -->|"Email + Password"| ClerkCreate["Clerk signUp.create()"]
    ClerkCreate -->|"unsafeMetadata"| ClerkSave["Clerk stores metadata"]
    ClerkSave --> VerifyEmail["Email verification<br/>code sent"]
    VerifyEmail -->|"Enter code"| Complete["signUp.attemptEmailVerification()"]
    Complete -->|"Session created"| Dashboard
    
    ClerkCreate -.->|"Webhook (async)"| Backend["FastAPI /webhooks/clerk"]
    Backend -->|"Svix verify"| ValidateMD["Validate metadata"]
    ValidateMD -->|"Create User"| UserTable[(users)]
    ValidateMD -->|"Create Student"| StudentTable[(students)]
```

### 6.2 Security Posture

| Concern | Mitigation |
|---------|-----------|
| Client-forged metadata | Backend re-validates `onboarding_complete` from allowed values |
| Bot signups | Clerk CAPTCHA via `<div id="clerk-captcha" />` |
| Webhook forgery | Svix cryptographic signature verification |
| Unauthorized dashboard | Clerk middleware `auth.protect()` on `/dashboard(.*)` |
| Session hijacking | Clerk-managed sessions with HTTP-only cookies |
| API abuse (future) | Clerk JWT verification middleware needed |

---

## 7. Mock Exam Pipeline (Current)

### 7.1 Current Architecture (No Backend)

```mermaid
flowchart TB
    subgraph "Frontend Only Execution"
        Card["Dashboard: Mock Exam Card"]
        Setup["Setup Wizard<br/>Subject → Chapter → Units → Length → Confirm"]
        
        subgraph "Exam Session"
            Fullscreen["Fullscreen Mode"]
            Timer["Countdown Timer"]
            Questions["Question Display<br/>Prompt + Options"]
            Navigator["Question Grid<br/>Answered/Seen/Unseen"]
            Submit["Submit + Results"]
        end
        
        Results["Results Panel<br/>Score % + Correct/Incorrect + Review"]
    end
    
    subgraph "Data Sources (Hardcoded)"
        Subjects["3 Subjects<br/>Physics, Chemistry, Maths"]
        Chapters["6 Chapters<br/>2 per subject"]
        Units["18 Units<br/>3 per chapter"]
        QuestionBank["10 Questions<br/>Ranked by PYQ frequency"]
        Config["Length Configs<br/>Short: 3Q/15m<br/>Standard: 5Q/35m<br/>Full: 8Q/60m"]
    end
    
    Card --> Setup
    Setup --> Fullscreen
    Fullscreen --> Questions
    Fullscreen --> Timer
    Questions --> Navigator
    Navigator --> Submit
    Submit --> Results
    
    Subjects --> Setup
    Chapters --> Setup
    Units --> Setup
    Config --> Setup
    QuestionBank --> Questions
```

### 7.2 Question Selection Algorithm Detail

```
1. Filter: subjectId == selectedSubject && chapterId == selectedChapter
2. Filter: unitId IN (selectedUnits OR all chapter units)
3. Score each question: 
     frequency * 0.4 + importance * 0.4 + difficultyWeight * 0.2
4. Sort by score descending
5. Take top N (3/5/8 based on exam length)
```

### 7.3 Security Measures During Exam

| Measure | Implementation |
|---------|---------------|
| Tab-switch detection | `visibilitychange` → cancellation |
| Fullscreen enforcement | `requestFullscreen()` on start |
| Fullscreen-exit detection | `fullscreenchange` → cancellation |
| Accidental close prevention | `beforeunload` event |
| Controlled exit | `allowFullscreenExitRef` for safe teardown |
| Timer integrity | Server-side timeout needed in future |

### 7.4 What Gets Lost (No Backend)

- **Exam results** — Gone on page refresh
- **Attempt history** — No data for weakness detection
- **Question bank updates** — Questions are hardcoded
- **Personalization** — No adaptation based on past performance
- **Cross-session analytics** — No trend data

---

## 8. Planned System Evolution

### 8.1 Feature Roadmap

```mermaid
flowchart TB
    Today["Today: Auth + Onboarding + Mock Exam UI"]
    
    Phase1["Phase 1: Backend APIs<br/>Question Bank + Mock Attempts"]
    Phase2["Phase 2: Weakness Detection<br/>Agent analyzes attempt patterns"]
    Phase3["Phase 3: Dashboard Real Data<br/>Connect widgets to APIs"]
    Phase4["Phase 4: Study Planner<br/>Autonomous schedule generation"]
    Phase5["Phase 5: Interventions<br/>Proactive alerts and adjustments"]
    Phase6["Phase 6: Advanced Features<br/>Paper Evaluator, Adaptive Simulator"]
    
    Today --> Phase1
    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4
    Phase4 --> Phase5
    Phase5 --> Phase6
```

### 8.2 Phase 1 Detail: Question Bank + Mock Attempts

**New Backend Tables:**
```
question_sources (id, name, year, board, exam_type)
questions (id, source_id, prompt, difficulty, subject, chapter, unit)
question_options (id, question_id, text, is_correct)
mock_attempts (id, student_id, started_at, submitted_at, score)
mock_attempt_answers (id, attempt_id, question_id, selected_option, is_correct)
```

**New API Endpoints:**
```
GET  /api/subjects             → Subject[]
GET  /api/subjects/:id/chapters → Chapter[]
GET  /api/questions?subject=X&chapter=Y → Question[]
POST /api/mock/attempts        → { attempt_id, score, results }
GET  /api/mock/attempts/:id    → AttemptDetail
```

**Frontend Changes:**
- Replace hardcoded questions with API calls
- POST answers/results on submission
- Load dashboard metrics from API instead of placeholders

### 8.3 Phase 2 Detail: Weakness Detection

**New Backend Tables:**
```
student_weaknesses (id, student_id, concept, severity, detected_at)
```

**Algorithm:**
```
For each student:
  1. Aggregate wrong answers by chapter/unit
  2. Cluster by prerequisite concepts
  3. Calculate severity: (wrong_in_concept / total_in_concept) * importance
  4. Return top 5 weaknesses
```

**New API Endpoints:**
```
GET /api/weakness/:student_id → Weakness[]
```

### 8.4 System Growth Projection

```mermaid
graph TB
    subgraph "Current System (13 backend files, 44 frontend files)"
        CurrentAPI["2 working endpoints<br/>2 stub endpoints"]
        CurrentTables["2 tables<br/>(users, students)"]
        CurrentUI["Hardcoded data<br/>No API integration"]
    end
    
    subgraph "Phase 1-2 (~50% growth)"
        PhaseAPI["8-10 endpoints<br/>Question + Attempt + Weakness"]
        PhaseTables["7 tables<br/>+5 new tables"]
        PhaseUI["API-connected<br/>Live dashboard data"]
    end
    
    subgraph "Phase 3-6 (Full system)"
        FullAPI["15-20 endpoints<br/>All agentic features"]
        FullTables["12-15 tables<br/>Full analytics schema"]
        FullUI["Fully dynamic<br/>Real-time insights"]
    end
    
    CurrentAPI --> PhaseAPI
    CurrentTables --> PhaseTables
    CurrentUI --> PhaseUI
    PhaseAPI --> FullAPI
    PhaseTables --> FullTables
    PhaseUI --> FullUI
```

---

## 9. Integration Points

### 9.1 Current Integrations

| Integration | Type | Direction | Protocol |
|-------------|------|-----------|----------|
| Clerk Auth | SaaS | Frontend ↔ Clerk | REST + SDK |
| Clerk Webhooks | SaaS | Clerk → Backend | HTTP POST + Svix |
| PostgreSQL | Database | Backend → DB | SQLAlchemy ORM |

### 9.2 Planned Integrations

| Integration | Type | Purpose | Priority |
|-------------|------|---------|----------|
| Gemini AI | API | Agentic features (weakness detection, planner) | High |
| Stripe | SaaS | Subscription billing for pricing plans | Medium |
| Email/SMS | API | Intervention notifications, reminders | Medium |
| Cloud Storage | SaaS | PDF upload for paper evaluator | Low |

### 9.3 Integration Contracts

**Clerk ↔ Frontend:**
```typescript
// @clerk/nextjs provides:
<ClerkProvider>        // Auth context
<SignIn />             // Pre-built sign-in component
useSignUp()            // Custom signup hook
auth.protect()         // Middleware protection
UserButton             // User menu component
```

**Clerk ↔ Backend (Webhook):**
```python
# Svix-verified payload
event = Webhook(CLERK_WEBHOOK_SECRET).verify(payload, headers)
event["type"]          # "user.created"
event["data"]["unsafe_metadata"]  # Onboarding data
```

**Frontend ↔ Backend (Future API):**
```typescript
// Expected REST contract
interface APIResponse<T> {
  data: T;
  error?: { message: string; code: string };
}
```

---

## 10. Development Workflow

### 10.1 Running the Full Stack

```bash
# Terminal 1: Start PostgreSQL (assumes Docker or local install)
# (no docker-compose committed yet)

# Terminal 2: Start Backend
cd backend
source .venv/bin/activate    # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload  # http://127.0.0.1:8000

# Terminal 3: Start Frontend
cd frontend
npm install
npm run dev  # http://localhost:3000
```

### 10.2 Verification Checklist

```bash
# Frontend
cd frontend
npm run lint    # tsc --noEmit - type check
npm run build   # next build - production build

# Backend
cd backend
source .venv/bin/activate
python -m compileall app  # Python syntax check
```

### 10.3 Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready, reviewed code |
| `feature/*` | Individual feature branches |
| `feature/clerk-onboarding` | Active branch (auth + onboarding) |

**Guidelines:**
- Small, focused commits
- Feature branches from `main`
- PRs for code review
- No direct pushes to `main`

### 10.4 Local Environment Setup

**Prerequisites:**
- Node.js (for frontend)
- Python 3.x + virtualenv (for backend)
- PostgreSQL running locally
- Clerk account (free tier)

**Frontend .env.local:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

**Backend .env:**
```env
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/sutra_ai
CLERK_WEBHOOK_SECRET=whsec_...
```

---

## 11. Tech Debt & Known Gaps

### 11.1 Critical Gaps (Must Fix Before Production)

| # | Gap | Location | Impact | Suggested Fix |
|---|-----|----------|--------|---------------|
| 1 | **No requirements.txt** | Backend root | New devs can't install deps | `pip freeze > requirements.txt` |
| 2 | **No backend auth** | All API routes | APIs are unprotected | Add Clerk JWT verification middleware |
| 3 | **Monolithic mock-exam-dashboard.tsx** | Frontend | ~1700 lines, 5 concerns | Split into focused components |
| 4 | **Hardcoded questions** | Frontend | Can't update without redeploy | Backend question bank API |
| 5 | **Ephemeral exam results** | Frontend | Data lost on refresh | POST to backend on submit |
| 6 | **No DB session DI** | Backend `webhooks.py` | Manual session management | FastAPI `Depends(get_db)` |

### 11.2 Moderate Gaps

| # | Gap | Location | Suggested Fix |
|---|-----|----------|---------------|
| 7 | **No Alembic migrations** | Backend | Set up Alembic for schema versioning |
| 8 | **Empty schemas directory** | Backend `schemas/` | Add Pydantic models for all entities |
| 9 | **No test infrastructure** | Both repos | pytest (backend) + vitest/playwright (frontend) |
| 10 | **Error handling inconsistency** | Backend | Add structured error responses |
| 11 | **No loading states** | Frontend | Add Suspense boundaries, skeletons |
| 12 | **No API error handling** | Frontend | Add error boundaries, retry logic |

### 11.3 Low Priority / Cosmetic

| # | Gap | Notes |
|---|------|-------|
| 13 | Typos in component names (`sheard.tsx` → `shared.tsx`) | Non-breaking |
| 14 | `react-example` in package.json name | Should be `sutra-ai-frontend` |
| 15 | Stub auth routes in backend (`/auth/login`) | Not used (Clerk handles auth) |
| 16 | Missing `routes/__init__.py` and `schemas/__init__.py` | Inconsistent package structure |

### 11.4 Tech Debt Visualization

```mermaid
flowchart TB
    subgraph "Red Zone (Critical)"
        A["No requirements.txt"]
        B["No API Auth"]
        C["Monolithic Component"]
        D["Hardcoded Data"]
    end
    
    subgraph "Yellow Zone (Moderate)"
        E["No Alembic"]
        F["Empty Schemas"]
        G["No Tests"]
        H["Error Handling"]
    end
    
    subgraph "Green Zone (Low Priority)"
        I["Typos"]
        J["Package Name"]
        K["Stub Routes"]
        L["Missing __init__.py"]
    end
    
    A -->|"Blocks onboarding"| E
    B -->|"Security risk"| F
    C -->|"Maintenance burden"| G
    D -->|"No real data"| H
```

---

## 12. Architecture Decision Records

### ADR-001: Clerk for Authentication

**Decision:** Use Clerk for both frontend auth and backend user lifecycle.  
**Rationale:** 
- Eliminates need to build auth infrastructure
- Provides pre-built UI components
- Webhook-driven user sync
- Scales for MVP needs  
**Trade-off:** Vendor lock-in; `unsafeMetadata` cannot be trusted

### ADR-002: Frontend State Without Global Store

**Decision:** Use React local state (useState, useRef) exclusively — no Redux/Zustand.  
**Rationale:** 
- Current complexity doesn't warrant global state
- Few cross-component state dependencies
- Keeps bundle size minimal  
**Trade-off:** Will need migration when agentic features add cross-cutting state

### ADR-003: Static Mock Questions (MVP)

**Decision:** Hardcode 10 questions in the frontend for the MVP demo.  
**Rationale:** 
- Fastest path to working demo
- Backend question bank not ready
- Validates exam UI flow end-to-end  
**Trade-off:** Questions are not realistic; no persistence; no analytics

### ADR-004: Raw SQL Migrations

**Decision:** Use raw SQL files instead of Alembic for schema changes.  
**Rationale:** 
- Minimal setup for small schema
- Single migration so far
- Easy to understand for all contributors  
**Trade-off:** No versioning, no rollback, manual application

### ADR-005: One-to-One User ↔ Student

**Decision:** Separate `users` and `students` tables with one-to-one relationship.  
**Rationale:** 
- `users` holds auth data (email, clerk ID)
- `students` holds educational metadata
- Clean separation of concerns  
**Trade-off:** Requires join queries for full student context

### ADR-006: Server-Side Onboarding Validation

**Decision:** Derive `onboarding_complete` server-side, don't trust Clerk's client-writable metadata.  
**Rationale:** 
- `unsafeMetadata` is client-writable
- Prevents malicious bypass of onboarding flow
- Defines explicit allowed values  
**Trade-off:** Duplication of validation logic (frontend step checks + backend validation)

---

## 13. Getting Started for Contributors

### 13.1 First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd sutra-ai

# 2. Set up backend
cd backend
python -m venv .venv
# Activate virtual environment:
#   Linux/Mac: source .venv/bin/activate
#   Windows:   .venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy python-dotenv svix psycopg2-binary
cp .env.example .env
# Edit .env with your DATABASE_URL and CLERK_WEBHOOK_SECRET

# 3. Set up frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Clerk keys

# 4. Start PostgreSQL (ensure it's running on localhost:5432)

# 5. Create database tables
cd ../backend
python -c "from app.database import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine)"

# 6. Start backend (Terminal 1)
uvicorn app.main:app --reload

# 7. Start frontend (Terminal 2)
cd ../frontend
npm run dev
```

### 13.2 Project Walkthrough

**If you're working on frontend only:**
- Start with `frontend/app/` to understand routing
- Read `mock-exam-dashboard.tsx` for the main feature
- Check `auth-page.tsx` for the onboarding flow
- Understand `proxy.ts` for route protection

**If you're working on backend only:**
- Start with `backend/app/main.py` for routes
- Read `webhooks.py` for the core business logic
- Understand `models/user.py` and `models/student.py` for data schema
- Check `database.py` for connection setup

**If you're working on both (integration):**
- Understand the **metadata contract** (JSON passed via Clerk)
- Understand the **webhook flow** (Clerk → Svix → Backend → DB)
- Understand the **planned API contract** (future REST endpoints)
- Check the **Integration Points** section above

### 13.3 Common Tasks

**Adding a new database field:**
1. Add field to SQLAlchemy model (`models/student.py` or new file)
2. Create migration SQL in `backend/migrations/`
3. Run migration against local DB
4. Update webhook metadata mapping if needed
5. Update frontend onboarding wizard if user-facing

**Adding a new frontend route:**
1. Create file in `frontend/app/<route>/page.tsx`
2. Add to Clerk middleware protection if needed (`proxy.ts`)
3. Create component in `frontend/components/`
4. Add navigation link if needed

**Connecting frontend to backend:**
1. Add API endpoint in `backend/app/routes/`
2. Register router in `main.py`
3. Add Pydantic schema for validation
4. Call endpoint from frontend using `fetch()` or a lib
5. Handle loading/error states

---

## Appendix A: File Manifest (Complete)

### Frontend (44 files)

```
frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── auth/page.tsx
│   └── dashboard/
│       ├── page.tsx
│       └── mock-exam/page.tsx
├── components/
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── globe-feature-section.tsx
│   │   ├── input.tsx
│   │   ├── input-group.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── scroll-reveal-text.tsx
│   │   ├── testimonial.tsx
│   │   └── textarea.tsx
│   ├── blocks/
│   │   └── testimonials-columns-1.tsx
│   ├── dashboard/
│   │   └── mock-exam-dashboard.tsx
│   ├── icons/
│   │   ├── apple-icon.tsx
│   │   ├── github-icon.tsx
│   │   └── google-icon.tsx
│   ├── auth-divider.tsx
│   ├── auth-page.tsx
│   ├── cobe-globe.tsx
│   ├── contact-section.tsx
│   ├── desktop-nav.tsx
│   ├── faq-accordion.tsx
│   ├── feature-section.tsx
│   ├── floating-paths.tsx
│   ├── header.tsx
│   ├── hero.tsx
│   ├── logo.tsx
│   ├── logo-cloud.tsx
│   ├── logos-section.tsx
│   ├── mobile-nav.tsx
│   ├── nav-links.tsx
│   ├── portal.tsx
│   ├── pricing-section.tsx
│   ├── scroll-reveal-concept.tsx
│   ├── sheard.tsx
│   ├── testimonials-carousel.tsx
│   └── theme-toggle.tsx
├── hooks/
│   ├── use-scroll.ts
│   └── use-theme.ts
├── lib/
│   └── utils.ts
├── src/components/shadcn-space/avatar/
│   └── avatar-08.tsx
├── assets/.aistudio/.gitignore
├── .env.example
├── .gitignore
├── components.json
├── metadata.json
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── proxy.ts
├── tsconfig.json
└── README.md
```

### Backend (15 files)

```
backend/
├── .env.example
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── create_tables.py
│   ├── test_db.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── student.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── student.py (empty)
│   │   └── webhooks.py
│   └── schemas/
│       └── student.py (empty)
└── migrations/
    └── 001_add_student_onboarding_fields.sql
```

---

## Appendix B: Key Metrics Dashboard

| Metric | Frontend | Backend | Total |
|--------|----------|---------|-------|
| Source files | ~44 | 14 | ~58 |
| Lines of code | ~5,000+ | ~333 | ~5,300+ |
| Routes/Pages | 4 (1 marketing, 1 auth, 2 protected) | 4 (1 health, 2 stubs, 1 working) | 8 |
| Database tables | 0 | 2 | 2 |
| Working endpoints | 0 (client-only) | 2 | 2 |
| External integrations | 2 (Clerk, fonts) | 2 (Clerk, PostgreSQL) | 4 |
| Components | ~30+ | N/A | ~30+ |

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **PYQ** | Previous Year Questions — real exam questions from past board exams |
| **Clerk** | Third-party authentication service (replaces custom auth) |
| **Svix** | Webhook signature verification library (verifies Clerk webhooks) |
| **unsafeMetadata** | Clerk's client-writable metadata field (NOT trusted server-side) |
| **Agent** | Autonomous AI module (e.g., Weakness Detection Agent) |
| **Board** | Educational board (CBSE, ICSE, GSEB, etc.) |
| **Stream** | Academic stream (Science, Commerce) |
| **Science Group** | Subject combination (PCB, PCM, PCMB) |
| **Onboarding** | Multi-step wizard collecting student metadata before signup |

---

> **End of Full-System Architecture Document**  
> Frontend deep-dive: `openclaude_frontend.md`  
> Backend deep-dive: `openclaude_backend.md`
