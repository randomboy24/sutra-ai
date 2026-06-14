# Task Ticket: Weakness Detection Agent

> **Owner:** Jatin  
> **Status:** 📝 Planning  
> **Priority:** High (unblocks Krish's Personalized Question Bank + Autonomous Study Planner)  
> **Dependencies:** ✅ `question_sources`, `questions`, `question_options`, `mock_attempts`, `mock_attempt_answer` tables exist (migration 004)  
> **Estimates:** Backend ~2 days, Frontend ~1 day

---

## 1. Problem Statement

We currently record mock attempt answers (`mock_attempt_answers`) with correctness flags and per-question metadata, but **no analysis layer** sits on top of that data. Students see their score percentage but get no insight into *why* they got questions wrong — which chapters/units are weak, which question types trip them up, whether difficulty level matters, or whether there are recurring misconception patterns.

Without this analysis, downstream features remain blocked:
- **Personalized Question Bank** (Krish) — needs weakness data to recommend targeted questions
- **Autonomous Study Planner** (Krish) — needs weakness areas to build study plans
- **AI Intervention Engine** (Jatin) — needs weakness triggers to decide when to intervene

---

## 2. Data Sources Available

### 2.1 `mock_attempts`
| Column | Type | Use |
|---|---|---|
| `id` | VARCHAR(36) PK | Identify attempt |
| `student_id` | VARCHAR(36) FK → students | Per-student aggregation |
| `board`, `class_level`, `stream`, `subject` | VARCHAR | Filter context |
| `chapter`, `unit` | VARCHAR (nullable) | Chapter-level breakdown |
| `total_questions`, `correct_count`, `attempted_count` | INTEGER | Accuracy per attempt |
| `score_percentage` | FLOAT | Overall score |
| `duration_seconds` | INTEGER (nullable) | Time analysis |
| `submitted_at` | TIMESTAMP | Historical trends |

### 2.2 `mock_attempt_answers`
| Column | Type | Use |
|---|---|---|
| `question_id` | VARCHAR(36) FK → questions | Link to full question metadata |
| `is_correct` | BOOLEAN (nullable) | Per-question correctness |
| `score_awarded`, `max_score` | FLOAT | Partial credit + weight |
| `selected_option_id` | VARCHAR(36) FK → question_options | Wrong-option analysis |
| `time_spent_seconds` | INTEGER (nullable) | Speed per question |

### 2.3 `questions`
| Column | Type | Use |
|---|---|---|
| `chapter`, `unit` | VARCHAR | Group errors by topic |
| `difficulty` | VARCHAR (Easy/Medium/Hard) | Difficulty-based breakdown |
| `question_type` | VARCHAR (theory/mcq) | Type-based analysis |
| `frequency_score`, `importance_score` | FLOAT | Exam pattern weighting |
| `marks` | INTEGER | Weighted error scoring |
| `expected_answer` | TEXT (nullable) | For theory-question grading |

### 2.4 `question_options`
| Column | Type | Use |
|---|---|---|
| `is_correct` | BOOLEAN | Identify which option was correct vs what student picked |
| `label`, `text` | VARCHAR/TEXT | For distractor analysis |

### 2.5 `students`
| Column | Type | Use |
|---|---|---|
| `class_level`, `board`, `stream`, `science_group` | VARCHAR | Student profile context |

---

## 3. Proposed Architecture

### 3.1 New Tables

Two new tables in `backend/migrations/005_add_weakness_analysis.sql`:

```sql
CREATE TABLE weakness_analyses (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id),
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_attempts_analyzed INTEGER NOT NULL DEFAULT 0,
    overall_accuracy FLOAT NOT NULL DEFAULT 0,
    overall_weakness_score FLOAT NOT NULL DEFAULT 0,  -- 0=strong, 1=very weak
    total_questions_analyzed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX ix_weakness_analyses_student_id ON weakness_analyses (student_id);

CREATE TABLE weakness_items (
    id VARCHAR(36) PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL REFERENCES weakness_analyses(id),
    category_type VARCHAR NOT NULL,  -- 'chapter', 'unit', 'difficulty', 'question_type', 'misconception'
    category_name VARCHAR NOT NULL,  -- e.g., "Organic Chemistry", "Hard", "MCQ"
    subject VARCHAR NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    error_rate FLOAT NOT NULL DEFAULT 0,  -- 0.0 to 1.0
    avg_time_spent FLOAT,  -- seconds
    severity VARCHAR NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high', 'critical'
    frequency_score FLOAT DEFAULT 0,  -- how often this topic appears in exams
    importance_score FLOAT DEFAULT 0,  -- how important for exams
    recommendation TEXT  -- AI-generated suggestion
);

CREATE INDEX ix_weakness_items_analysis_id ON weakness_items (analysis_id);
CREATE INDEX ix_weakness_items_category ON weakness_items (category_type, category_name);
CREATE INDEX ix_weakness_items_severity ON weakness_items (severity);
```

### 3.2 Backend: Weakness Analysis Engine

**New service:** `backend/app/services/weakness_analysis.py`

The service should:
1. Fetch all attempts for a student
2. For each attempt, join with answers + questions
3. Compute per-category metrics:

**Required analysis dimensions:**

| Dimension | SQL/Logic | Example Output |
|---|---|---|
| **Chapter-level** | GROUP BY `chapter`, count errors | "Organic Chemistry: 60% error rate" |
| **Unit-level** | GROUP BY `unit`, count errors | "Biomolecules: 75% error rate" |
| **Difficulty-level** | GROUP BY `difficulty`, count errors | "Hard questions: 70% error rate" |
| **Question-type** | GROUP BY `question_type`, count errors | "MCQ: 30% vs Theory: 55%" |
| **Distractor analysis** | For wrong MCQs, which wrong option was picked most? | "Option B (common distractor) picked 40% of wrong answers" |
| **Time efficiency** | AVG time on correct vs wrong answers | "Correct: 45s, Wrong: 90s (overthinking)" |
| **Trend over time** | Order attempts by `submitted_at`, track accuracy | "Accuracy improving: 50% → 65% → 72%" |

**Severity classification:**
- `critical`: error_rate >= 0.8
- `high`: error_rate >= 0.6
- `medium`: error_rate >= 0.4
- `low`: error_rate < 0.4

**Recommendation generation (v1 — rule-based):**
- For critical/high severity chapters: "Revise [chapter] fundamentals. Focus on [specific unit with highest error rate]."
- For low severity: "Maintain current practice in [chapter]."
- For time-efficiency issues: "Practice timed questions in [chapter] to improve speed."

### 3.3 Backend API Endpoints

**New route:** `backend/app/routes/weakness.py` → prefix `/api/weakness`

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/weakness/analyze` | Trigger fresh analysis for current student | Clerk JWT |
| `GET` | `/api/weakness` | Get latest analysis summary for current student | Clerk JWT |
| `GET` | `/api/weakness/items` | Get all weakness items, optionally filtered by severity/category | Clerk JWT |
| `GET` | `/api/weakness/trends` | Get accuracy trend over time (per-attempt scores) | Clerk JWT |

**Response schemas** in `backend/app/schemas/weakness.py`:

```python
class WeaknessItemResponse(BaseModel):
    category_type: str
    category_name: str
    subject: str
    total_questions: int
    incorrect_count: int
    error_rate: float
    avg_time_spent: float | None
    severity: str
    frequency_score: float
    importance_score: float
    recommendation: str | None

class WeaknessAnalysisResponse(BaseModel):
    id: str
    generated_at: str
    total_attempts_analyzed: int
    overall_accuracy: float
    overall_weakness_score: float
    total_questions_analyzed: int
    items: list[WeaknessItemResponse]

class WeaknessTrendPoint(BaseModel):
    attempt_id: str
    subject: str
    chapter: str | None
    score_percentage: float
    correct_count: int
    total_questions: int
    submitted_at: str
```

### 3.4 Frontend: Weakness Analysis Dashboard Panel

**New component:** `frontend/components/dashboard/weakness-analysis-panel.tsx`

Should show:
1. **Overall weakness score** (gauge / progress bar: 0–100, where 0 = no weaknesses)
2. **Accuracy trend chart** — simple line chart showing score_percentage over last N attempts
3. **Breakdown by category** — expandable sections:
   - **By Chapter** — sorted by error_rate descending, color-coded by severity
   - **By Difficulty** — Easy/Medium/Hard error rates
   - **By Question Type** — MCQ vs Theory performance
4. **Top weaknesses** — top 5 most critical items with recommendations
5. **"Run Analysis" button** — triggers `POST /api/weakness/analyze`

**Tab on mock-exam-dashboard:** Add `"weakness"` to `DashboardSection` type and wire the panel.

### 3.5 Hooks

**New hook:** `frontend/hooks/use-weakness-analysis.ts`

Pattern identical to `use-exam-readiness.ts` / `use-academic-health.ts`:
- `useAuth().getToken()` for auth
- `fetch()` calls to `/api/weakness/*`
- Loading + error + data states

### 3.6 API Client

Add to `frontend/lib/api.ts`:

```typescript
export interface WeaknessItemData { ... }
export interface WeaknessAnalysisData { ... }
export interface WeaknessTrendPoint { ... }
export async function fetchWeaknessAnalysis(token: string): Promise<WeaknessAnalysisData>
export async function triggerWeaknessAnalysis(token: string): Promise<WeaknessAnalysisData>
export async function fetchWeaknessTrends(token: string): Promise<WeaknessTrendPoint[]>
```

---

## 4. Implementation Plan

### Step 1: Migration — Create Tables
- File: `backend/migrations/005_add_weakness_analysis.sql`
- Tables: `weakness_analyses`, `weakness_items`
- Run migration against local PostgreSQL

### Step 2: Models
- File: `backend/app/models/weakness.py`
- SQLAlchemy ORM classes: `WeaknessAnalysis`, `WeaknessItem`
- Update `backend/app/models/__init__.py`

### Step 3: Schemas
- File: `backend/app/schemas/weakness.py`
- Pydantic request/response models

### Step 4: Analysis Engine Service
- File: `backend/app/services/weakness_analysis.py`
- Core logic: fetch attempts → compute per-dimension metrics → classify severity → generate recommendations
- Should handle edge case: student with 0 attempts → return empty analysis with 0 values
- Should handle edge case: partial data (missing time_spent, null is_correct) → skip those dimensions gracefully

### Step 5: Routes
- File: `backend/app/routes/weakness.py`
- 4 endpoints as specified above
- Register in `backend/app/main.py`

### Step 6: Frontend API Types + Client
- Add types + functions to `frontend/lib/api.ts`

### Step 7: Frontend Hook
- File: `frontend/hooks/use-weakness-analysis.ts`

### Step 8: Frontend Panel Component
- File: `frontend/components/dashboard/weakness-analysis-panel.tsx`
- Dashboard tab on mock-exam-dashboard.tsx

### Step 9: Verification
- `lsp_diagnostics` clean on all changed files
- Backend: `python -m compileall backend/app`
- Frontend: `npm run lint` + `npm run build`

---

## 5. Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Analysis storage | Separate `weakness_analyses` + `weakness_items` tables | Avoids recomputing on every request; enables history/comparison |
| Trigger model | Manual ("Run Analysis" button) | Simpler for v1; can add auto-trigger on attempt submission later |
| Recommendations | Rule-based (no LLM) | V1 doesn't need Gemini; rules are deterministic, fast, testable |
| Severity thresholds | 80/60/40 breakpoints | Matches common academic grading intuition |
| Panel placement | Dashboard tab, same as Health + Readiness | Consistent UX pattern |
| Auth | Clerk JWT via `get_current_user` | Same as all other routes |

---

## 6. Future Enhancements (v2)

- **Auto-analysis**: Trigger `POST /api/weakness/analyze` automatically whenever a mock attempt is submitted
- **LLM-powered recommendations**: Replace rule-based recs with Gemini-generated study tips
- **Comparative analysis**: "You're weaker in Organic Chemistry than other students at your level"
- **Intervention triggers**: If weakness score crosses threshold, push notification / email
- **Time-series trends**: Track weakness scores week-over-week, show improvement/decline
- **Distractor heatmap**: Visual heatmap showing which wrong options students pick per chapter

---

## 7. Edge Cases & Error Handling

- **Zero attempts**: Return empty analysis (all zeros, empty items)
- **Partial data**: If question has no `is_correct` flag, exclude from error rate calc but include in total count
- **Deleted questions**: Answers referencing now-inactive questions should still be counted
- **Concurrent analysis**: If student clicks "Analyze" twice rapidly, deduplicate or block second until first completes
- **Large data**: For students with 100+ attempts, use server-side pagination/limits (analyze last 50 by default)
