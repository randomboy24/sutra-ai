# Task Ticket: Personalized Question Bank

> **Owner:** Krish  
> **Status:** 📝 Planning  
> **Priority:** High (unblocks Autonomous Study Planner + feeds into Adaptive Exam Simulator)  
> **Dependencies:** ✅ `questions` + `question_options` tables exist (migration 004), ✅ `weakness_analyses` + `weakness_items` tables exist (migration 005), ✅ Weakness Detection Agent merged to main  
> **Estimates:** Backend ~1 day, Frontend ~1 day, Total ~2 days

---

## 1. Problem Statement

Students currently can browse the question bank by manually filtering subject/chapter/unit and get generic questions sorted by `frequency_score × importance_score`. This is a **one-size-fits-all** approach — every student sees the same questions in the same order.

We now have **weakness data** per student (`weakness_items` with `category_type='chapter'` and `severity`). The Personalized Question Bank uses this data to:

1. **Surface questions from weak chapters** — prioritize questions the student is most likely to get wrong
2. **Rank by relevance** — weight questions by `weakness_severity × question_importance` instead of generic priority
3. **Adapt over time** — as weakness analysis is re-run, the recommended question set changes

**Without this feature:** Students waste time on questions from chapters they already know well, while weak areas get insufficient practice.

---

## 2. Data Sources Available

### 2.1 `weakness_items` (New — From Weakness Detection)

| Column | Type | Use |
|--------|------|-----|
| `student_id` (via analysis join) | VARCHAR(36) FK | Per-student weakness lookup |
| `category_type` | VARCHAR | Filter: only `chapter`-type items for question targeting |
| `category_name` | VARCHAR | The chapter name (e.g., "Organic Chemistry") |
| `subject` | VARCHAR | Subject scope (physics / chemistry / biology) |
| `error_rate` | FLOAT (0.0–1.0) | How weak the student is in this chapter |
| `severity` | VARCHAR | `critical` / `high` / `medium` / `low` |
| `frequency_score` | FLOAT | How often this chapter appears in PYQs |
| `importance_score` | FLOAT | How important this chapter is for exams |

### 2.2 `weakness_analyses` (New — From Weakness Detection)

| Column | Type | Use |
|--------|------|-----|
| `id` | VARCHAR(36) PK | Link to latest analysis |
| `student_id` | VARCHAR(36) FK | Per-student latest analysis |
| `generated_at` | TIMESTAMP | Determine which analysis is latest |

### 2.3 `questions` (Existing)

| Column | Type | Use |
|--------|------|-----|
| `chapter` | VARCHAR | Match against `weakness_items.category_name` |
| `subject` | VARCHAR | Match against `weakness_items.subject` |
| `unit` | VARCHAR | Second-level targeting within chapter |
| `difficulty` | VARCHAR (Easy/Medium/Hard) | Optional difficulty filter |
| `frequency_score` | FLOAT | Exam importance weighting |
| `importance_score` | FLOAT | Weight component for ranking |
| `marks` | INTEGER | Question weight |
| `is_active` | BOOLEAN | Exclude inactive questions |
| `board`, `class_level`, `stream` | VARCHAR | Student-scope matching |
| `question_type` | VARCHAR | MCQ vs theory preference |

### 2.4 `students` (Existing)

| Column | Type | Use |
|--------|------|-----|
| `class_level` | VARCHAR | Match question scope |
| `board` | VARCHAR | Match question scope |
| `stream` | VARCHAR | Match question scope |

---

## 3. Proposed Architecture

### 3.1 No New Tables Needed

The Personalized Question Bank is a **computed-on-read** feature. It does not write to any new tables. It reads:
- Latest `weakness_analysis` + `weakness_items` (for chapter weakness data)
- `questions` table (for available questions)
- Filters and ranks in real-time

### 3.2 Ranking Algorithm

For each question in the bank, compute a **personalized priority score**:

```
personalized_score = raw_priority_score × weakness_multiplier

Where:
  raw_priority_score = question.frequency_score × 0.6 + question.importance_score × 0.4
  weakness_multiplier = 
    1.0 + 0.5  if chapter has severity = "critical"
    1.0 + 0.3  if chapter has severity = "high"  
    1.0 + 0.1  if chapter has severity = "medium"
    1.0        if chapter has severity = "low" or chapter not in weakness data
```

This ensures:
- Questions from critical chapters get **50% boost** in ranking
- Questions from high-severity chapters get **30% boost**
- Questions from medium-severity chapters get **10% boost**
- All other chapters remain at baseline priority

**Why this formula instead of just filtering to weak chapters:** Because students also need practice in strong chapters (maintenance). The boost approach ensures weak chapters dominate the top of the list without completely hiding other content.

### 3.3 Backend Service

**New file:** `backend/app/services/recommended_questions.py`

The service should:

1. **Find latest weakness analysis** for the student
2. **Build a weakness map** — chapter → {error_rate, severity, frequency_score, importance_score} for all chapter-type weakness items
3. **Query active questions** matching the student's board/class/stream, with optional subject/chapter/difficulty filters
4. **Compute personalized priority** for each question using the ranking algorithm above
5. **Sort descending** by personalized priority score
6. **Return top N** questions (default 10, max 50)

**Edge cases handled:**
- No weakness analysis exists → fall back to raw `priority_score` (behaves like current generic list)
- Weakness analysis exists but has no chapter-type items → fall back to raw priority
- Student with no questions matching their board/class → return empty list
- Chapter name mismatch between weakness data and question tag → question falls back to baseline multiplier

### 3.4 Backend API Endpoints

**Existing route extension:** `backend/app/routes/mock_exams.py` (add new endpoint to existing router)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/api/mock-exams/recommended` | Get personalized recommended questions | Clerk JWT |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `subject` | string | — | Filter by subject (optional) |
| `difficulty` | string | — | Filter: `Easy`, `Medium`, `Hard` (optional) |
| `limit` | int | 10 | Max questions to return (1–50) |

**Response Schema:** Reuse `QuestionListResponse` from existing schemas (same shape as `GET /api/mock-exams/questions`)

**Response `200`:**
```json
{
  "questions": [
    {
      "id": "uuid",
      "subject": "physics",
      "chapter": "Electrostatics",
      "unit": "Coulomb's Law",
      "difficulty": "Medium",
      "text": "Two point charges +2μC and -2μC...",
      "frequency_score": 0.85,
      "importance_score": 0.9,
      "priority_score": 0.87,
      "personalized_score": 1.13,
      ...existing_question_fields...
    }
  ]
}
```

The `personalized_score` field is new — it indicates the boost from weakness data. Frontend can use it for sorting display or showing "Recommended because you struggled in X chapter" badges.

### 3.5 Schema Changes

**Modify:** `backend/app/schemas/mock_exam.py`

Add `personalized_score` as an optional field to `QuestionResponse`:
```python
class QuestionResponse(BaseModel):
    ...existing fields...
    personalized_score: Optional[float] = None  # NEW
```

### 3.6 Frontend: Recommended Questions Section

**New component:** `frontend/components/dashboard/recommended-questions-panel.tsx`

This is the v1 — a dashboard tab or dedicated section showing recommended questions. Should show:

1. **Header:** "Recommended for You" with explanation: "Based on your latest weakness analysis"
2. **Question cards** ranked by personalized priority:
   - Question text (truncated)
   - Chapter + subject badge
   - Difficulty badge
   - "Weakness boost" indicator: e.g., "🔴 From your critical chapter: Electrostatics"
3. **"Start Practice" button** — triggers a new mock exam with these recommended questions (opens mock exam flow)
4. **Refresh button** — re-fetches after re-analyzing weaknesses
5. **Empty state** — if no weakness data: "Run a weakness analysis first to get personalized recommendations"
6. **Loading state** — skeleton cards
7. **Error state** — retry button

### 3.7 Frontend: Integration Points

**Dashboard integration** — Add to `mock-exam-dashboard.tsx`:
- New `"recommended"` value in `DashboardSection` type
- New tab button in the navigation tabs
- Wire the component with existing `useWeaknessAnalysis` hook for weakness data

**Or simpler v1:** Add a card on the existing Mock Exam page showing "Recommended Questions" that pre-fills the setup form with recommended parameters.

**Recommended approach (v1 simplest):** Add a dashboard tab `"recommended"` that shows the recommended questions panel. This follows the exact same pattern as health/readiness/weakness tabs.

### 3.8 Hooks

**New hook:** `frontend/hooks/use-recommended-questions.ts`

Pattern identical to `use-weakness-analysis.ts`:
- `useAuth().getToken()` for auth
- `fetch()` to `GET /api/mock-exams/recommended`
- Loading + error + data states with `useApiResource`

```typescript
// Pseudocode
export function useRecommendedQuestions(subject?: string) {
  return useApiResource<MockQuestionData[]>(
    async (token) => {
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      params.set("limit", "10");
      const data = await fetchRecommendedQuestions(token, params.toString());
      return data.questions;
    },
    { revalidateOnFocus: false }
  );
}
```

### 3.9 API Client

Add to `frontend/lib/api.ts`:
```typescript
export interface RecommendedQuestionData extends MockQuestionData {
  personalized_score?: number;
}

export async function fetchRecommendedQuestions(
  token: string,
  queryString: string
): Promise<{ questions: RecommendedQuestionData[] }> {
  const res = await fetch(
    `${API_BASE}/api/mock-exams/recommended?${queryString}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Failed to fetch recommended questions");
  return res.json();
}
```

---

## 4. Implementation Plan

### Step 1: Add `personalized_score` to QuestionResponse schema
- File: `backend/app/schemas/mock_exam.py`
- Add `personalized_score: Optional[float] = None` to `QuestionResponse`

### Step 2: Create recommendation service
- File: `backend/app/services/recommended_questions.py`
- Function: `get_recommended_questions(db, student_id, subject, difficulty, limit)`
- Core logic: fetch latest weakness analysis → build chapter weakness map → query questions → compute personalized scores → sort → return top N
- Load the `brainstorming` skill for design validation

### Step 3: Add recommended endpoint to mock_exams route
- File: `backend/app/routes/mock_exams.py`
- New `GET /api/mock-exams/recommended` endpoint
- Reuse `_get_current_student` helper
- Reuse `_question_response` helper (extend to pass personalized_score)

### Step 4: Frontend API types + client
- File: `frontend/lib/api.ts`
- Add `RecommendedQuestionData` interface
- Add `fetchRecommendedQuestions` function

### Step 5: Frontend hook
- File: `frontend/hooks/use-recommended-questions.ts`
- Pattern: identical to `use-weakness-analysis.ts`

### Step 6: Frontend panel component
- File: `frontend/components/dashboard/recommended-questions-panel.tsx`
- Show question cards with weakness context badges
- Loading / empty / error / data states

### Step 7: Dashboard integration
- File: `frontend/components/dashboard/mock-exam-dashboard.tsx`
- Add `"recommended"` to `DashboardSection`
- Wire the panel as a new tab

### Step 8: Verification
- `lsp_diagnostics` clean on all changed files
- Backend: `python -m compileall backend/app`
- Frontend: `npm run lint` + `npm run build`

---

## 5. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | No new tables (computed on read) | Weakness data already persisted; questions already exist. Computation is cheap (~50ms for 150 questions) |
| Ranking | `raw_priority × weakness_multiplier` | Balances weakness targeting with educational value (Feynman technique: you also need to practice what you know) |
| Weakness source | Only `category_type='chapter'` | Chapters map 1:1 to question tags. Unit/difficulty/type don't have direct question-bank equivalents |
| Multiplier values | 1.5 / 1.3 / 1.1 / 1.0 | Empirically chosen to give weak chapters meaningful priority without dominating the entire list |
| Endpoint location | `/api/mock-exams/recommended` (existing router) | Related to questions; reuses existing auth patterns and student lookup; reduces new router boilerplate |
| Panel placement | Dashboard tab (same pattern as health/readiness/weakness) | Consistent UX — students know where to find dashboard features |

---

## 6. Future Enhancements (v2)

- **Unit-level targeting**: If `category_type='unit'` weakness items exist, boost questions from specific units within weak chapters
- **Difficulty-aware boosting**: If student has high error_rate on "Hard" difficulty, boost hard questions from weak chapters even more
- **Exclude recently-practiced questions**: Track which recommended questions were recently answered and skip them
- **Spaced repetition schedule**: Use a simple SM-2 algorithm to determine when to re-show each question
- **Adaptive difficulty**: If student is improving on a weak chapter, shift to harder questions within that chapter
- **AI-generated explanations**: Gemini generates personalized explanations for why each question is recommended

---

## 7. Edge Cases & Error Handling

| Scenario | How It's Handled |
|----------|-----------------|
| **No weakness analysis exists** | Fall back to raw `priority_score` sorting (same as current generic list) |
| **Weakness analysis has no chapter-type items** | Fall back to raw priority |
| **Student has no matching questions** | Return empty questions list (graceful empty state) |
| **Chapter name mismatch** (weakness uses "Org. Chem" but question uses "Organic Chemistry") | Falls back to baseline multiplier for that question (no crash, just no boost) |
| **All questions from weak chapters already answered** | Still returns them (v1 doesn't track answered state; v2 can exclude) |
| **Student changes board/class/stream** | Questions filtered by student profile; weakness analysis is reset on profile change |
| **Weakness data exists but outdated** (analysis from months ago) | System returns questions boosted by outdated data; "Run Analysis" prompt shown |
| **Concurrent requests** | Stateless read endpoint — no locking needed |
| **Zero questions match filters** | Return empty `{ questions: [] }` — frontend shows empty state |
| **Student ID not found** | `_get_current_student()` raises 404 (same pattern as all routes) |
