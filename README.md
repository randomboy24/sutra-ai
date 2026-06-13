# Sutra AI

Sutra AI is an agentic learning and exam-preparation platform for students. The current MVP focuses on Clerk-based student onboarding, a protected dashboard, and a dynamic mock exam experience that will later connect to a real PYQ/question-bank backend.

The product direction is broader than mock tests: Sutra AI should observe student performance, detect weak concepts, rebuild study plans, trigger interventions, and personalize exam preparation.

## Current Status

| Area | Status |
| --- | --- |
| Frontend foundation | Built |
| Backend foundation | Built |
| Clerk authentication | Built |
| Student onboarding | Built |
| Protected dashboard | Built |
| Dashboard feature hub | Built |
| Mock exam UI flow | Built |
| Mock exam backend API | Planned |
| PYQ ingestion/question bank | Planned |
| Agentic intelligence layer | Planned |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Authentication | Clerk |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL |
| Webhooks | Clerk user lifecycle webhook verified with Svix |
| Styling/UI | Tailwind tokens, lucide-react icons, custom dashboard components |

## Repository Structure

```text
sutra-ai/
  frontend/
    app/
      auth/
      dashboard/
      dashboard/mock-exam/
    components/
      auth-page.tsx
      dashboard/mock-exam-dashboard.tsx
      theme-toggle.tsx
    proxy.ts
  backend/
    app/
      main.py
      database.py
      models/
      routes/
      schemas/
    migrations/
      001_add_student_onboarding_fields.sql
```

## Architecture

```mermaid
flowchart LR
  Student[Student Browser] --> Next[Next.js Frontend]
  Next --> ClerkUI[Clerk Sign In / Sign Up]
  ClerkUI --> Clerk[Clerk]
  Clerk -->|user.created webhook| FastAPI[FastAPI Backend]
  FastAPI -->|verify Svix signature| Webhook[Webhook Handler]
  Webhook --> DB[(PostgreSQL)]

  Next --> Dashboard[Protected Dashboard]
  Dashboard --> MockUI[Mock Exam UI]
  MockUI -. planned .-> MockAPI[Mock Exam API]
  MockAPI -. planned .-> QuestionBank[(PYQ Question Bank)]
  QuestionBank -. planned .-> Agents[Agentic Intelligence Layer]
  Agents -. planned .-> Dashboard
```

## Auth And Onboarding Flow

```mermaid
sequenceDiagram
  participant Student
  participant Frontend as Next.js /auth
  participant Clerk
  participant Backend as FastAPI /webhooks/clerk
  participant DB as PostgreSQL

  Student->>Frontend: Open /auth
  Frontend->>Student: Show Sign up / Sign in
  Student->>Frontend: Choose Sign up
  Frontend->>Student: Run onboarding wizard
  Student->>Frontend: Submit class, board, stream metadata
  Frontend->>Clerk: Create signup with unsafeMetadata
  Clerk->>Student: Complete signup / verification
  Clerk->>Backend: Send user.created webhook
  Backend->>Backend: Verify webhook signature
  Backend->>DB: Create User and Student rows
  Frontend->>Student: Redirect to /dashboard
```

## Dashboard Feature Hub

The dashboard now acts as the shared workspace for Jatin and Krish. It shows every planned feature as a high-level card with owner, status, signal inputs, and next milestone.

Implemented dashboard elements:

- Command-center hero section.
- High-level demo metrics:
  - Academic Health
  - Exam Readiness
  - Weak Concepts
  - Today's Plan
- Feature roadmap cards.
- Desktop sidebar navigation.
- Mobile hamburger navigation.
- Dark-mode compatible styling.
- Subtle hover and card micro-interactions.
- SVG signal-map visual.
- Reserved placeholder panels for future features.

## Built Features

### 1. Clerk Authentication

Implemented:

- `@clerk/nextjs` installed on the frontend.
- `ClerkProvider` wired into the app layout.
- Next 16-compatible root `proxy.ts` protects `/dashboard(.*)`.
- `/`, `/auth`, and static assets remain public.
- Clerk sign-in UI is used for sign in.
- Sign-in and sign-up redirect to `/dashboard`.

Important files:

- `frontend/app/layout.tsx`
- `frontend/proxy.ts`
- `frontend/app/auth/page.tsx`
- `frontend/components/auth-page.tsx`

### 2. Student Onboarding

Implemented:

- Custom onboarding wizard before Clerk signup.
- Student MVP path enabled.
- Institute flow marked coming soon.
- Individual student path enabled.
- Class selection: `10th`, `12th`.
- Board selection: `CBSE` enabled, `GSEB` and `ICSE` coming soon.
- Stream selection: `science`, `commerce`.
- Science group selection: `pcb`, `pcm`, `pcmb`.
- Clerk CAPTCHA support for custom signup bot protection.
- Signup metadata sent to Clerk through `unsafeMetadata`.

Current metadata contract:

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

Security note: `unsafeMetadata` is client-writable and must not be used as trusted authorization data. The backend currently derives `onboarding_complete` from allowed metadata values instead of trusting the client flag directly.

### 3. Clerk Webhook Persistence

Implemented:

- Clerk webhook route at `/webhooks/clerk`.
- Webhook signature verification with `CLERK_WEBHOOK_SECRET`.
- `user.created` handling.
- Idempotent user creation.
- Student row creation for student users.
- Onboarding metadata persisted into the `students` table.
- Partial retry handling where a user exists but a student row is missing.

Important files:

- `backend/app/routes/webhooks.py`
- `backend/app/models/user.py`
- `backend/app/models/student.py`
- `backend/migrations/001_add_student_onboarding_fields.sql`

### 4. Protected Dashboard

Implemented:

- `/dashboard` is Clerk-protected.
- Dashboard includes Clerk `UserButton`.
- Theme toggle is available in the top bar.
- Dashboard defaults to the active Mock Exam feature hub.

Important files:

- `frontend/app/dashboard/page.tsx`
- `frontend/components/dashboard/mock-exam-dashboard.tsx`

### 5. Dynamic Mock Test Generator UI

Implemented:

- Mock Exam feature card on the dashboard.
- Start button routes to `/dashboard/mock-exam`.
- Dedicated mock setup page.
- Step-by-step setup flow:
  - Subject
  - Chapter
  - Units
  - Exam length
  - Confirmation
- Fullscreen mock exam session UI.
- Question panel with options.
- Question grid navigator.
- Answered, seen, and unseen question states.
- Timer.
- Submit flow.
- Result summary and answer review.
- Tab-switch and fullscreen-exit cancellation handling.
- Cancellation redirects back to `/dashboard` with the Mock Exam tab open.
- Dashboard modal explains the cancellation reason.

Important files:

- `frontend/app/dashboard/mock-exam/page.tsx`
- `frontend/components/dashboard/mock-exam-dashboard.tsx`

## Mock Exam Flow

```mermaid
flowchart TD
  A[Dashboard Mock Exam Card] --> B[Start Mock Exam]
  B --> C[/dashboard/mock-exam]
  C --> D[Choose Subject]
  D --> E[Choose Chapter]
  E --> F[Choose Units]
  F --> G[Choose Length]
  G --> H[Confirm Mock]
  H --> I[Fullscreen Exam]
  I --> J{Student Action}
  J -->|Submit| K[Results + Review]
  J -->|Switch Tab| L[Cancel Exam]
  J -->|Exit Fullscreen| L
  L --> M[/dashboard?section=mock]
  M --> N[Cancellation Modal]
```

## Current Database Model

```mermaid
erDiagram
  users ||--o| students : has

  users {
    string id PK
    string clerk_user_id UK
    string email UK
    string role
  }

  students {
    string id PK
    string user_id FK
    string full_name
    boolean is_individual
    string institute_id
    string class_level
    string board
    string stream
    string science_group
    boolean onboarding_complete
  }
```

## Planned Features

These are visible in the dashboard feature hub but not fully implemented yet.

| Feature | Owner | Status | Notes |
| --- | --- | --- | --- |
| Academic Health Monitoring Agent | Krish | Planned | Track scores, attendance, study time, weak subjects, learning speed, revision frequency. |
| Weakness Detection Agent | Jatin | Next | Detect mistake patterns and infer root causes from wrong answers. |
| Autonomous Study Planner | Krish | Planned | Rebuild study plans from exam dates, performance, available hours, and learning speed. |
| AI Intervention Engine | Jatin | Planned | Trigger reminders, easier tasks, workload reduction, and mentor alerts. |
| Exam Readiness Score | Krish | Planned | Predict preparedness, expected score, weak chapters, and confidence. |
| AI Paper Evaluator | Jatin | Planned | Evaluate uploaded handwritten/PDF answer sheets against marking schemes. |
| Personalized Question Bank | Krish | Planned | Recommend questions based on mistakes, weaknesses, and board patterns. |
| Adaptive Exam Simulator | Jatin | Planned | Adjust question difficulty during exams to estimate capability. |
| PYQ Question Bank Backend | Shared | Planned | Store real PYQs, tags, sources, occurrences, difficulty, and importance scores. |

## Recommended Next Backend Slice

The next practical backend feature should be the Weakness Detection foundation because it builds directly on mock exam attempts.

Suggested scope:

1. Add question-bank tables.
2. Add mock attempt and answer tables.
3. Add submit mock result API.
4. Add weakness summary API.
5. Connect dashboard widgets to real mock result data.

Future question-bank tables will likely include:

- `question_sources`
- `questions`
- `question_options`
- `question_occurrences`
- `question_tags`
- `mock_attempts`
- `mock_attempt_answers`
- `student_weaknesses`

## Environment Variables

Frontend:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Backend:

```env
DATABASE_URL=postgresql_psycopg://username:password@localhost:5432/dbname
CLERK_WEBHOOK_SECRET=
```

## Running Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:3000
```

Useful frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

### Backend

The backend uses a virtual environment at `backend/.venv`.

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

Useful backend check:

```bash
cd backend
source .venv/bin/activate
python -m compileall app
```

## Database Migration

For existing local databases, apply:

```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS class_level VARCHAR,
ADD COLUMN IF NOT EXISTS board VARCHAR,
ADD COLUMN IF NOT EXISTS stream VARCHAR,
ADD COLUMN IF NOT EXISTS science_group VARCHAR,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
```

Committed migration file:

```text
backend/migrations/001_add_student_onboarding_fields.sql
```

## Validation Completed So Far

- Frontend typecheck passed with `npm run lint`.
- Frontend production build passed with `npm run build`.
- Backend compile validation has passed with `python -m compileall app`.
- Clerk signup flow reached the backend webhook.
- User and student persistence was verified locally.
- Student onboarding database migration was applied locally.
- Mock exam dashboard and dedicated mock route build successfully.

## Product Roadmap Diagram

```mermaid
flowchart TB
  Foundation[Auth + Onboarding + Dashboard Hub] --> Mock[Dynamic Mock Test Generator]
  Mock --> Attempts[Mock Attempts + Answers]
  Attempts --> Weakness[Weakness Detection Agent]
  Attempts --> Readiness[Exam Readiness Score]
  Weakness --> QuestionBank[Personalized Question Bank]
  Weakness --> Planner[Autonomous Study Planner]
  Readiness --> Planner
  Planner --> Intervention[AI Intervention Engine]
  QuestionBank --> Adaptive[Adaptive Exam Simulator]
  Paper[AI Paper Evaluator] --> Weakness
  Paper --> Readiness
```

## Notes For Contributors

- Keep frontend and backend changes on focused feature branches.
- Make small commits as features are completed.
- Keep dashboard UI dark-mode compatible.
- Do not commit real `.env` secrets.
- Backend commands should activate `backend/.venv` first.
- Do not treat Clerk `unsafeMetadata` as trusted authorization data.
- Prefer building the real question-bank/attempt schema before adding complex AI behavior.
