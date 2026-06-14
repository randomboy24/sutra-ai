# Task Ticket: Autonomous Study Planner

> **Owner:** Krish
> **Status:** Planning
> **Priority:** High (third agentic feature in the roadmap)
> **Dependencies:**
>   - Mock Attempts + Answers (migration 004)
>   - Weakness Analysis (migration 005, route `/api/weakness`)
>   - Academic Health (route `/api/health`)
>   - Exam Readiness (route `/api/readiness`)
>   - Personalized Question Bank (route `/api/mock-exams/recommended`)
>   - Available-hours input (needs new frontend form)
>   - Exam-date input (needs new frontend form)
> **Estimates:** Backend ~2 days, Frontend ~1.5 days

---

## 1. Problem Statement

Students currently have no structured daily plan that tells them **what to study, when, and for how long**. They see:

- **Weakness Analysis** -- "You're weak in Electrostatics (80% error rate)" -- but no *action* tied to it.
- **Academic Health** -- "Your streak is 5 days" -- but no guidance on what to study *today*.
- **Exam Readiness** -- "Your readiness is 60%" -- but no plan to reach 80% before the exam.
- **Personalized Question Bank** -- "Here are 10 recommended questions" -- but no schedule for when to attempt them.

The Autonomous Study Planner closes this gap by **converting analysis into a daily study schedule**. It is the single most impactful feature in the agentic stack because:

1. It **consumes** output from Weakness Detection + Academic Health + Exam Readiness.
2. It **produces** a concrete, day-by-day task list the student can follow.
3. It **motivates** via completion tracking, streak protection, and daily progress.
4. It **unblocks** the AI Intervention Engine (which needs to detect when the student isn't following the plan).

Without this planner, all analysis features remain *passive* -- they tell the student *what's wrong* but not *what to do about it today*.

---

## 2. Data Sources Available

### 2.1 Inputs Consumed by the Planner

| Data | Source Table / API | What We Get | Why We Need It |
|---|---|---|---|
| Weak chapters + severity | `WeaknessItem` (via `GET /api/weakness/items?category_type=chapter`) | Per-chapter: `category_name`, `subject`, `error_rate`, `severity`, `frequency_score`, `importance_score`, `recommendation` | **Primary input** -- chapters with highest error rate get most study time |
| Weakness items by unit | Same (via `category_type=unit`) | Per-unit error rates | Fine-grained allocation within chapters |
| Academic health | `AcademicHealth` (via `GET /api/health`) | `study_hours_week`, `engagement_streak`, `revision_frequency`, `mock_accuracy` | **Calibration** -- a student already studying 20h/week needs a different plan than one studying 2h/week |
| Exam readiness | `ExamReadiness` (via `GET /api/readiness`) | `readiness_score`, `weak_chapters`, `strong_chapters`, `confidence_level`, `syllabus_coverage` | **Baseline + target** -- plan should move readiness from current to higher |
| Student profile | `Student` | `board`, `class_level`, `stream`, `science_group` | Curriculum scope |
| Subject/chapter list | `Question` (distinct) or curriculum config | All subjects and chapters for the student's board/class/stream | Full syllabus coverage |
| Recommended questions | `GET /api/mock-exams/recommended` | Personalized questions with `personalized_score` | Embed practice tasks in the plan |
| Mock attempt history | `MockAttempt` (via `GET /api/weakness/trends`) | Score trend over time | Detects improvement or stagnation |

### 2.2 New Inputs Required (User-Provided)

| Input | Type | Why Needed | How Collected |
|---|---|---|---|
| **Exam date(s)** | `date` per subject | Determines days-remaining for urgency scaling | Frontend form on first setup |
| **Available hours/day** | `float` (1-12) | Daily capacity constraint | Frontend form on first setup |
| **Preferred subjects today** | `string[]` (optional) | Override -- "I want to focus on Physics today" | Editable per-day in the plan view |

### 2.3 Output: Study Plan Data Model

**New table:** `study_plans`

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `student_id` | VARCHAR(36) FK -> students | Owner |
| `name` | VARCHAR | Auto-generated: "Plan for Jun 15 - Jul 14" |
| `exam_dates` | TEXT (JSON) | `{"physics": "2026-07-14", "chemistry": "2026-07-16"}` |
| `daily_hours` | FLOAT | Hours/day this plan was built for |
| `total_days` | INTEGER | Plan duration |
| `generated_at` | TIMESTAMP | Creation timestamp |
| `status` | VARCHAR | `active` / `completed` / `replaced` |
| `metrics_snapshot` | TEXT (JSON) | Snapshot of data used to generate this plan |

**New table:** `study_tasks`

| Column | Type | Description |
|---|---|---|
| `id` | VARCHAR(36) PK | UUID |
| `plan_id` | VARCHAR(36) FK -> study_plans | Parent plan (CASCADE DELETE) |
| `scheduled_date` | DATE | When to do this task |
| `day_number` | INTEGER | Day 1, Day 2, ... |
| `subject` | VARCHAR | e.g., "physics" |
| `chapter` | VARCHAR (nullable) | e.g., "Electrostatics" |
| `unit` | VARCHAR (nullable) | Specific unit within chapter |
| `task_type` | VARCHAR | `study` / `practice` / `review` / `mock_exam` |
| `duration_minutes` | INTEGER | Allotted time |
| `priority_score` | FLOAT | The computed priority that determined its slot |
| `session_label` | VARCHAR | Human-readable label |
| `description` | TEXT (nullable) | Detailed instruction |
| `completed` | BOOLEAN | Default false |
| `completed_at` | TIMESTAMP (nullable) | When student marked it done |

**SQL migration** -- `backend/migrations/006_add_study_planner.sql`:

```sql
CREATE TABLE study_plans (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id),
    name VARCHAR NOT NULL,
    exam_dates TEXT NOT NULL DEFAULT '{}',
    daily_hours FLOAT NOT NULL DEFAULT 2.0,
    total_days INTEGER NOT NULL DEFAULT 30,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR NOT NULL DEFAULT 'active',
    metrics_snapshot TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX ix_study_plans_student_id ON study_plans (student_id);
CREATE INDEX ix_study_plans_status ON study_plans (status);

CREATE TABLE study_tasks (
    id VARCHAR(36) PRIMARY KEY,
    plan_id VARCHAR(36) NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    subject VARCHAR NOT NULL,
    chapter VARCHAR NULL,
    unit VARCHAR NULL,
    task_type VARCHAR NOT NULL DEFAULT 'study',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    session_label VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NULL
);

CREATE INDEX ix_study_tasks_plan_id ON study_tasks (plan_id);
CREATE INDEX ix_study_tasks_date ON study_tasks (plan_id, scheduled_date);
CREATE INDEX ix_study_tasks_completed ON study_tasks (plan_id, completed);
```

---

## 3. Algorithm: Rule-Based Scheduling Engine

### 3.1 Core Principle

The scheduling engine treats study planning as a **constrained optimization problem**:

```
Given:
  - Set of chapters to cover (with priority scores)
  - Daily time budget (available_hours)
  - Total days until exam

Produce:
  - Day-by-day schedule allocating time across chapters

Constraint: Every chapter gets at least some time before the exam.
Objective: Maximize total priority-weighted coverage.
```

### 3.2 Priority Score for Each Chapter

```
priority(chapter) = weakness_multiplier * exam_urgency * consistency_bonus

where:
  weakness_multiplier  = severity_weight * error_rate_multiplier
  exam_urgency         = 1 + (days_remaining_factor / 2)
  consistency_bonus    = 0.9 to 1.1 based on engagement_streak
```

**Severity weights** (same as Personalized Question Bank):

| Severity | Weight |
|---|---|
| `critical` | 1.5 |
| `high` | 1.3 |
| `medium` | 1.1 |
| `low` / no data | 1.0 |

**Error-rate multiplier**: `1 + (error_rate * 0.5)` -- a chapter with 80% error rate gets 1.4x, a chapter with 20% error rate gets 1.1x.

**Combined weakness_multiplier**: `severity_weight * error_rate_multiplier`

**Exam urgency factor**: `1 + (30 - days_remaining) / 60` -- ranges from ~1.5 (30 days out) to ~1.0 (day of exam). Chapters for sooner exams get a boost.

**Consistency bonus**: `0.9 + (min(streak, 30) / 300)` -- ranges from 0.9 (streak=0) to 1.0 (streak=30).

### 3.3 Task Type Allocation Per Day

Each day's time budget is split into buckets:

```
Daily hours = total_available (user-input, default 2h)

Normal mode (more than 7 days until exam):
  - Study new/revisit content        40%
  - Practice (solve questions)       30%
  - Review previous day's mistakes   20%
  - Mock exam / full-length test     10%

Cram mode (last 7 days before exam):
  - Study new/revisit content        20%
  - Practice (solve questions)       25%
  - Review previous day's mistakes   25%
  - Mock exam / full-length test     30%
```

### 3.4 Daily Scheduling Algorithm (Pseudocode)

```
function generate_plan(chapters, priorities, exam_dates, daily_hours, start_date):
    total_days = min_days_until_exam(exam_dates)
    sorted_chapters = sort_by_priority_desc(chapters)
    daily_slots = floor(daily_hours * 60 / MIN_SLOT_MINUTES)  // 30-min slots

    // Split into rotation groups if chapters exceed daily capacity
    groups = split_into_rotation_groups(sorted_chapters, daily_slots)

    for day in range(total_days):
        day_date = start_date + day
        day_tasks = []
        today_chapters = select_chapters_for_day(groups, day, daily_slots)

        for chapter in today_chapters:
            task_type = determine_task_type(chapter, day, total_days)
            minutes = calculate_duration(chapter, task_type, daily_hours)
            task = StudyTask(
                scheduled_date=day_date,
                day_number=day + 1,
                subject=chapter.subject,
                chapter=chapter.name,
                task_type=task_type,
                duration_minutes=minutes,
                priority_score=chapter.priority,
                session_label=generate_label(chapter, task_type),
                description=generate_description(chapter),
            )
            day_tasks.append(task)

        plan.append(day_tasks)

    return plan
```

### 3.5 Chapter Rotation Strategy

When the number of weak chapters exceeds what fits in a single day:

| Chapters vs Slots | Strategy | Example |
|---|---|---|
| <= daily_slots | Every chapter every day | 3 chapters, 5 slots -> all daily |
| <= 2x daily_slots | A/B day alternation | 7 chapters, 4 slots -> Mon/Wed/Fri = group A, Tue/Thu/Sat = group B |
| > 2x daily_slots | Round-robin with priority weighting | 12 chapters, 4 slots -> top 4 daily, next 4 every other day, rest every 3rd day |

### 3.6 Strong Chapter Maintenance

**15% of daily "study" bucket** is reserved for strong chapters to prevent decay:

- For each strong chapter (from `ExamReadiness.strong_chapters`):
  - Rotate through them on a fixed cycle
  - Allocate 10-15 minutes per appearance
  - Task type: `review` (quick, no deep study)

### 3.7 Mock Exam / Practice Scheduling

When recommended questions are available:

- Schedule a **practice task** every 3rd day:
  - Label: "Practice recommended questions - [subject]"
  - Duration: 20 minutes
  - Links to: `GET /api/mock-exams/recommended?subject=...`

- Schedule a **full mock exam** every 7th day:
  - Label: "Full mock exam"
  - Duration: 45-60 minutes

### 3.8 Empty / Edge Cases

| Scenario | Behavior |
|---|---|
| No weakness data | Balanced plan: rotate all subjects evenly across available hours |
| No academic health data | Defaults: `study_hours_week=10`, `streak=0`, `consistency_bonus=1.0` |
| No exam dates set | Assume 30 days from today, show advisory banner |
| Student enters 0 hours/day | Error: "At least 1 hour per day is required" |
| All chapters are strong | Maintenance-only plan: light review rotation + mock practice |
| Multiple subjects, different exam dates | Prioritize nearer exam in early days, then switch focus |
| 50+ weak chapters | Cap at top 15 by priority score, log warning |
| Student completes 7+ consecutive days | Increase consistency_bonus |
| Student misses 3+ consecutive days | Flag for AI Intervention Engine (future), reduce consistency_bonus |

---

## 4. API Design

### 4.1 Backend Endpoints

**New route:** `backend/app/routes/study_planner.py` -> prefix `/api/study-planner`

| Method | Path | Description | Request | Response |
|---|---|---|---|---|
| `POST` | `/api/study-planner/generate` | Generate a new study plan | `{ exam_dates, daily_hours, subject_focus? }` | `StudyPlanResponse` |
| `GET` | `/api/study-planner/active` | Get the current active plan | -- | `StudyPlanResponse` (or 404) |
| `GET` | `/api/study-planner/plans` | List all past plans | -- | `list[StudyPlanSummary]` |
| `GET` | `/api/study-planner/plans/{plan_id}` | Get a specific plan + tasks | -- | `StudyPlanResponse` |
| `GET` | `/api/study-planner/tasks/today` | Get today's tasks for active plan | -- | `list[StudyTaskResponse]` |
| `PATCH` | `/api/study-planner/tasks/{task_id}` | Mark task complete/incomplete | `{ completed: bool }` | `StudyTaskResponse` |
| `PUT` | `/api/study-planner/regenerate` | Replace active plan with new one | Same as generate | `StudyPlanResponse` |

### 4.2 Response Schemas

```python
class StudyTaskResponse(BaseModel):
    id: str
    scheduled_date: str
    day_number: int
    subject: str
    chapter: str | None
    unit: str | None
    task_type: str  # 'study' | 'practice' | 'review' | 'mock_exam'
    duration_minutes: int
    priority_score: float
    session_label: str
    description: str | None
    completed: bool
    completed_at: str | None


class StudyPlanResponse(BaseModel):
    id: str
    name: str
    exam_dates: dict[str, str]
    daily_hours: float
    total_days: int
    generated_at: str
    status: str
    metrics_snapshot: dict
    tasks: list[StudyTaskResponse]


class StudyPlanSummary(BaseModel):
    id: str
    name: str
    total_days: int
    generated_at: str
    status: str
    tasks_completed: int
    tasks_total: int


class GeneratePlanRequest(BaseModel):
    exam_dates: dict[str, str]
    daily_hours: float = Field(default=2.0, ge=1.0, le=12.0)
    subject_focus: list[str] | None = None
```

### 4.3 Frontend Routes

| Route | Component | Purpose |
|---|---|---|
| `/study-planner` | `StudyPlannerPage` | Full-page view of active plan, day-by-day task list |
| Tab on dashboard | `StudyPlannerPanel` | Summary panel (matching Health/Readiness/Weakness pattern) |

---

## 5. Implementation Plan

### Step 1: Migration -- Create Tables
- File: `backend/migrations/006_add_study_planner.sql`
- Tables: `study_plans`, `study_tasks`
- Run migration against local PostgreSQL

### Step 2: Models
- File: `backend/app/models/study_planner.py`
- SQLAlchemy ORM: `StudyPlan`, `StudyTask`
- Add relationship to `Student`
- Update `backend/app/models/__init__.py`

### Step 3: Schemas
- File: `backend/app/schemas/study_planner.py`
- Pydantic models: `GeneratePlanRequest`, `StudyTaskResponse`, `StudyPlanResponse`, `StudyPlanSummary`

### Step 4: Planning Engine Service
- File: `backend/app/services/study_planner.py`

| Function | Purpose |
|---|---|
| `generate_plan(db, student, exam_dates, daily_hours, subject_focus)` | Orchestrator: fetch data, compute priorities, schedule, persist |
| `_compute_chapter_priorities(weakness_items, strong_chapters, exam_dates, health_data)` | Priority formula from 3.2 |
| `_build_daily_schedule(chapter_priorities, exam_dates, daily_hours, start_date)` | Core scheduling algorithm from 3.3-3.7 |
| `_allocate_daily_buckets(daily_hours, day_number, total_days)` | Bucket allocation per day |
| `_select_chapters_for_day(chapters, day_number, daily_slots)` | Rotation strategy from 3.5 |
| `_determine_task_type(chapter, day_number, total_days)` | study/practice/review/mock_exam |
| `_generate_session_label(chapter, task_type)` | Human-readable label |
| `_generate_description(chapter, weakness_items)` | Detailed instruction text |

### Step 5: Routes
- File: `backend/app/routes/study_planner.py`
- 7 endpoints as defined in section 4.1
- Use `_get_current_student` pattern from existing routes
- Register in `backend/app/main.py`

### Step 6: Frontend API Client
- Add to `frontend/lib/api.ts`: types + fetch functions for all 7 endpoints

### Step 7: Frontend Hook
- File: `frontend/hooks/use-study-planner.ts`
- Pattern matching `use-weakness-analysis.ts`
- `useStudyPlanner()` returning active plan + tasks + loading/error/refetch

### Step 8: Frontend Panel Component
- File: `frontend/components/dashboard/study-planner-panel.tsx`
- Shows: plan summary, today's tasks with checkboxes, progress bar
- Loading/error/empty states matching existing panels

### Step 9: Wire Dashboard Tab
- Add `"study-plan"` to `DashboardSection` type (already exists in mock-exam-dashboard.tsx)
- Update section config from "Planned" to "Active"
- Wire panel in section routing

### Step 10: Setup/Input Form
- File: `frontend/components/dashboard/setup-plan-modal.tsx`
- Form: exam dates per subject + daily hours
- Validate: at least 1 hour, dates in future, at least one subject selected
- On submit: call `POST /api/study-planner/generate`, display plan

### Step 11: Verification
- `lsp_diagnostics` clean on all changed files
- Backend: `python -m compileall backend/app`
- Frontend: `npm run lint` + `npm run build`

---

## 6. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Planning approach | Rule-based (no LLM) | Scheduling is a constraint problem; LLM adds cost/latency/non-determinism with no accuracy benefit |
| Storage | `study_plans` + `study_tasks` tables | Persists across sessions; enables history/comparison |
| Trigger model | Explicit "Generate Plan" button | User controls when to create/replace |
| Plan updates | Full regeneration (PUT /regenerate) | Simpler than incremental updates for v1 |
| Exam dates | Per-subject dict | Supports staggered exam schedules (common in Indian boards) |
| Time allocation | Bucket-based (study/practice/review/mock) | More realistic than flat chapter rotation |
| Strong chapter maintenance | 15% reserve | Prevents knowledge decay without diluting weakness focus |
| Panel placement | Dashboard tab | Consistent with Health/Readiness/Weakness |
| Auth | Clerk JWT via `get_current_user` | Same as all other routes |

---

## 6. Future Enhancements (v2)

- **LLM-generated descriptions**: Replace rule-based task descriptions with personalized coaching messages
- **Auto-regenerate**: When new weakness analysis is available, prompt student to regenerate plan
- **Progress tracking**: Charts showing completed vs planned tasks over time
- **Smart rescheduling**: If student misses a day, auto-shift remaining tasks (not just replace)
- **Calendar integration**: Export plan to Google Calendar / Apple Calendar
- **Pomodoro integration**: Break study sessions into focused 25-min intervals with breaks
- **Peer comparison**: "Other students studying Physics are doing 30 min/day more than you"
- **Gamification**: Streak multipliers, achievement badges for completing N consecutive days
- **AI Intervention Engine hook**: If 3+ consecutive days missed, trigger intervention workflow

---

## 7. Edge Cases & Error Handling

- **Zero attempts analyzed**: No weakness data -> balanced plan across all subjects
- **All is_correct null in attempts**: Same as zero -> balanced plan
- **exam_dates empty**: Generate 30-day default plan with advisory message to set dates
- **daily_hours = 0**: Return 400: "At least 1 hour per day is required"
- **Subject in subject_focus not in curriculum**: Log warning, ignore silently
- **All chapters severity=low**: Maintenance-only plan (rotation + mock practice)
- **Same exam date for multiple subjects**: Compress schedule, proportionate time allocation
- **50+ weak chapters**: Cap at top 15 by priority, warn student to re-run analysis
- **Concurrent generate requests**: Block second until first completes (use in-progress flag)
- **Deleted student mid-plan**: CASCADE handles clean-up
- **Plan superseded before all tasks completed**: Old plan status = `replaced`, new plan = `active`
