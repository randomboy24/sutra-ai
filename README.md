# Sutra AI

Sutra AI is an agentic learning and exam-preparation platform for students. The current MVP includes Clerk-based student onboarding, a protected dashboard, a dynamic mock exam experience with a real PYQ question bank, and backend APIs for academic health and exam readiness tracking.

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
| Mock exam backend API | Built |
| PYQ question bank with demo data | Built |
| Academic Health API | Built |
| Exam Readiness API | Built |
| Clerk JWT verification (JWKS) | Built |
| Agentic intelligence layer | Planned |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS |
| Authentication | Clerk |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL (Docker) |
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
      dashboard/
        mock-exam-dashboard.tsx
        academic-health-panel.tsx
        exam-readiness-panel.tsx
      theme-toggle.tsx
    lib/
      api.ts
    proxy.ts
  backend/
    app/
      main.py
      database.py
      auth/
        verify.py
      models/
        user.py
        student.py
        academic_health.py
        exam_readiness.py
        mock_exam.py
      routes/
        auth.py
        webhooks.py
        health.py
        readiness.py
        mock_exams.py
        student.py
      schemas/
        health.py
        readiness.py
        mock_exam.py
      services/
        demo_pyq_seed.py
    data/pyq/parsed/
      cbse-class-12-physics-demo.json
      cbse-class-12-chemistry-demo.json
      cbse-class-12-biology-demo.json
    migrations/
      001_add_student_onboarding_fields.sql
      002_add_academic_health_table.sql
      003_add_exam_readiness_table.sql
      004_add_mock_exam_question_bank.sql
    scripts/
      seed_demo_pyq.py
  setup.sh
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
  MockUI --> MockAPI[Mock Exam API]
  MockAPI --> QuestionBank[(PYQ Question Bank)]
  Dashboard --> HealthUI[Academic Health UI]
  HealthUI --> HealthAPI[Academic Health API]
  Dashboard --> ReadinessUI[Exam Readiness UI]
  ReadinessUI --> ReadinessAPI[Exam Readiness API]
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

The dashboard acts as the shared workspace. It shows every planned feature as a high-level card with owner, status, signal inputs, and next milestone.

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
- Question panel with MCQ options.
- Question grid navigator.
- Answered, seen, and unseen question states.
- Timer.
- Persistent Submit exam button with confirmation dialog.
- Result summary and answer review.
- Tab-switch and fullscreen-exit cancellation handling.
- Cancellation redirects back to `/dashboard` with the Mock Exam tab open.
- Dashboard modal explains the cancellation reason.

Important files:

- `frontend/app/dashboard/mock-exam/page.tsx`
- `frontend/components/dashboard/mock-exam-dashboard.tsx`

### 6. Mock Exam Backend API

Implemented:

- `GET /api/mock-exams/questions` — List questions filtered by board, class, stream, subject, chapter, unit with priority-based sorting.
- `POST /api/mock-exams/attempts` — Submit a mock attempt with answers and get scored results.
- `GET /api/mock-exams/attempts` — List past attempts for the current student.
- `GET /api/mock-exams/attempts/{attempt_id}` — Get a specific attempt with answers.
- `POST /api/mock-exams/seed-demo` — Seed the question bank with demo PYQ data.
- Clerk JWT session verification via JWKS (`app/auth/verify.py`).
- All endpoints require a valid Clerk session token (Bearer auth).

Important files:

- `backend/app/routes/mock_exams.py`
- `backend/app/schemas/mock_exam.py`
- `backend/app/models/mock_exam.py`
- `backend/app/auth/verify.py`

### 7. PYQ Question Bank with Demo Data

Implemented:

- Database tables: `question_sources`, `questions`, `question_options`.
- 150 demo questions across Physics, Chemistry, and Biology (50 each).
- Each question has 4 MCQ options with one correct answer marked.
- Questions tagged with board, class, stream, subject, chapter, unit, difficulty, frequency score, and importance score.
- Priority-based question ranking: `frequency_score * 0.6 + importance_score * 0.4`.
- Seeding service at `app/services/demo_pyq_seed.py` with upsert logic.
- JSON data files in `data/pyq/parsed/`.

Important files:

- `backend/data/pyq/parsed/cbse-class-12-physics-demo.json`
- `backend/data/pyq/parsed/cbse-class-12-chemistry-demo.json`
- `backend/data/pyq/parsed/cbse-class-12-biology-demo.json`
- `backend/app/services/demo_pyq_seed.py`
- `backend/scripts/seed_demo_pyq.py`

### 8. Academic Health API

Implemented:

- Database table: `academic_health` with columns for health score, trend, study hours, revision frequency, engagement streak, and mock accuracy.
- `POST /api/health/seed` — Seed academic health data for the current student (idempotent upsert).
- `GET /api/health` — Fetch the current student's academic health data.
- Frontend panel at `frontend/components/dashboard/academic-health-panel.tsx`.

Important files:

- `backend/app/routes/health.py`
- `backend/app/schemas/health.py`
- `backend/app/models/academic_health.py`
- `backend/migrations/002_add_academic_health_table.sql`
- `frontend/components/dashboard/academic-health-panel.tsx`

### 9. Exam Readiness API

Implemented:

- Database table: `exam_readiness` with columns for readiness score, predicted score, weak/strong chapters, syllabus coverage, confidence level, and mock accuracy.
- `POST /api/readiness/seed` — Seed exam readiness data for the current student (idempotent upsert).
- `GET /api/readiness` — Fetch the current student's exam readiness data.
- Frontend panel at `frontend/components/dashboard/exam-readiness-panel.tsx`.

Important files:

- `backend/app/routes/readiness.py`
- `backend/app/schemas/readiness.py`
- `backend/app/models/exam_readiness.py`
- `backend/migrations/003_add_exam_readiness_table.sql`
- `frontend/components/dashboard/exam-readiness-panel.tsx`

## Mock Exam Flow

```mermaid
flowchart TD
  A["Dashboard Mock Exam Card"] --> B["Start Mock Exam"]
  B --> C["/dashboard/mock-exam"]
  C --> D["Choose Subject"]
  D --> E["Choose Chapter"]
  E --> F["Choose Units"]
  F --> G["Choose Length"]
  G --> H["Confirm Mock"]
  H --> I["Fullscreen Exam"]

  I --> J{"Student Action"}

  J -->|Submit or timer ends| K["Results + Review"]
  J -->|Switch Tab| L["Cancel Exam"]
  J -->|Exit Fullscreen| L

  L --> M["/dashboard?section=mock"]
  M --> N["Cancellation Modal"]

  classDef user fill:#0F766E,stroke:#14B8A6,stroke-width:2px,color:#F8FAFC;
  classDef screen fill:#2563EB,stroke:#60A5FA,stroke-width:2px,color:#F8FAFC;
  classDef decision fill:#D97706,stroke:#FBBF24,stroke-width:2px,color:#F8FAFC;
  classDef success fill:#15803D,stroke:#4ADE80,stroke-width:2px,color:#F8FAFC;
  classDef danger fill:#991B1B,stroke:#EF4444,stroke-width:2px,color:#F8FAFC;

  class A,B,D,E,F,G,H user;
  class C,I,M screen;
  class J decision;
  class K success;
  class L,N danger;
```

## Current Database Model

```mermaid
erDiagram
  users ||--o| students : has
  students ||--o| academic_health : has
  students ||--o| exam_readiness : has
  students ||--o| mock_attempts : has
  question_sources ||--o{ questions : contains
  questions ||--o{ question_options : has
  questions ||--o{ mock_attempt_answers : referenced
  mock_attempts ||--o{ mock_attempt_answers : contains

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

  academic_health {
    string id PK
    string student_id FK, UK
    float health_score
    string trend
    float study_hours_week
    int revision_frequency
    int engagement_streak
    float mock_accuracy
  }

  exam_readiness {
    string id PK
    string student_id FK, UK
    float readiness_score
    float predicted_score
    text weak_chapters
    text strong_chapters
    float syllabus_coverage
    string confidence_level
    float mock_accuracy
  }

  question_sources {
    string id PK
    string board
    string class_level
    string stream
    string subject
    string source_type
    string source_name UK
  }

  questions {
    string id PK
    string source_id FK
    string board
    string class_level
    string stream
    string subject
    string chapter
    string unit
    string question_number
    string question_type
    text text
    text expected_answer
    int marks
    string difficulty
    float frequency_score
    float importance_score
    int source_year
    boolean is_active
  }

  question_options {
    string id PK
    string question_id FK
    string label
    text text
    boolean is_correct
    int display_order
  }

  mock_attempts {
    string id PK
    string student_id FK
    string board
    string class_level
    string subject
    string chapter
    string unit
    string status
    int total_questions
    int attempted_count
    int correct_count
    float total_marks
    float score_awarded
    float score_percentage
  }

  mock_attempt_answers {
    string id PK
    string attempt_id FK
    string question_id FK
    string selected_option_id FK
    int selected_option_index
    boolean is_correct
    float score_awarded
    float max_score
  }
```

## Planned Features

These are visible in the dashboard feature hub but not fully implemented yet.

| Feature | Owner | Status | Notes |
| --- | --- | --- | --- |
| Weakness Detection Agent | Jatin | Next | Detect mistake patterns and infer root causes from wrong answers. |
| Autonomous Study Planner | Krish | Planned | Rebuild study plans from exam dates, performance, available hours, and learning speed. |
| AI Intervention Engine | Jatin | Planned | Trigger reminders, easier tasks, workload reduction, and mentor alerts. |
| AI Paper Evaluator | Jatin | Planned | Evaluate uploaded handwritten/PDF answer sheets against marking schemes. |
| Personalized Question Bank | Krish | Planned | Recommend questions based on mistakes, weaknesses, and board patterns. |
| Adaptive Exam Simulator | Jatin | Planned | Adjust question difficulty during exams to estimate capability. |

## Environment Variables

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
```

Backend (`backend/.env`):

```env
DATABASE_URL=postgresql+psycopg://sutra_ai_user:abcd@localhost:5432/sutra_ai
CLERK_WEBHOOK_SECRET=
CLERK_SECRET_KEY=
CLERK_JWKS_URL=https://your-clerk-frontend-api/.well-known/jwks.json
CLERK_ISSUER=https://your-clerk-frontend-api
CLERK_AUTHORIZED_PARTIES=http://localhost:3000,http://127.0.0.1:3000
```

## Running Locally

### Automated Setup

Run the setup script from the repo root:

```bash
./setup.sh
```

This will start PostgreSQL via Docker, install dependencies, apply migrations, and seed demo data. See `SETUP.md` for details.

### Manual Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Apply migrations
for f in migrations/*.sql; do psql -U sutra_ai_user -d sutra_ai -h localhost -f "$f"; done

# Seed demo data
python scripts/seed_demo_pyq.py

# Start the server
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### Manual Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

Useful frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Database Migrations

All migrations are in `backend/migrations/`:

| File | Purpose |
| --- | --- |
| `001_add_student_onboarding_fields.sql` | Adds onboarding columns to `students` table |
| `002_add_academic_health_table.sql` | Creates `academic_health` table |
| `003_add_exam_readiness_table.sql` | Creates `exam_readiness` table |
| `004_add_mock_exam_question_bank.sql` | Creates `question_sources`, `questions`, `question_options`, `mock_attempts`, `mock_attempt_answers` tables |

## Validation Completed So Far

- Frontend typecheck passed with `npm run lint`.
- Frontend production build passed with `npm run build`.
- Backend compile validation has passed with `python -m compileall app`.
- Clerk signup flow reached the backend webhook.
- User and student persistence was verified locally.
- Student onboarding database migration was applied locally.
- Mock exam dashboard and dedicated mock route build successfully.
- PYQ question bank seeded with 150 MCQ demo questions.
- Mock attempt submission, score calculation, and result retrieval tested.
- Academic Health and Exam Readiness seed/fetch API endpoints tested.

## Product Roadmap

```mermaid
flowchart TB
  Foundation["Auth + Onboarding + Dashboard Hub"] --> Mock["Dynamic Mock Test Generator"]

  Mock --> Attempts["Mock Attempts + Answers API"]

  Attempts --> Weakness["Weakness Detection Agent"]
  Attempts --> Readiness["Exam Readiness Score"]

  Weakness --> QuestionBank["Personalized Question Bank"]
  Weakness --> Planner["Autonomous Study Planner"]

  Readiness --> Planner

  Planner --> Intervention["AI Intervention Engine"]

  QuestionBank --> Adaptive["Adaptive Exam Simulator"]

  Paper["AI Paper Evaluator"] --> Weakness
  Paper --> Readiness

  classDef foundation fill:#4338CA,stroke:#818CF8,stroke-width:3px,color:#F8FAFC;

  classDef assessment fill:#2563EB,stroke:#60A5FA,stroke-width:2px,color:#F8FAFC;

  classDef analytics fill:#D97706,stroke:#FBBF24,stroke-width:2px,color:#F8FAFC;

  classDef planning fill:#0F766E,stroke:#2DD4BF,stroke-width:2px,color:#F8FAFC;

  classDef adaptive fill:#15803D,stroke:#4ADE80,stroke-width:2px,color:#F8FAFC;

  class Foundation foundation;

  class Mock,Attempts,Paper assessment;

  class Weakness,Readiness analytics;

  class Planner,Intervention,QuestionBank planning;

  class Adaptive adaptive;
```

## Notes For Contributors

- Keep frontend and backend changes on focused feature branches.
- Make small commits as features are completed.
- Keep dashboard UI dark-mode compatible.
- Do not commit real `.env` secrets.
- Backend commands should activate `backend/.venv` first.
- Do not treat Clerk `unsafeMetadata` as trusted authorization data.
- Prefer building the real question-bank/attempt schema before adding complex AI behavior.
- Run `./setup.sh` for a fresh local environment setup.
