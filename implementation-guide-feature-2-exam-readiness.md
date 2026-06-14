# Implementation Guide — Feature 2: Exam Readiness Score

> **Feature Owner:** Krish  
> **Priority:** Phase 2 (Needs shared mock attempt infra for real data)  
> **Status:** 🟢 Scaffolding can be built now (seed-data-driven, same pattern as Feature 1)  
> **Estimated Milestones:** 4 subtasks  
> **Branch:** `feat/exam-readiness-score`

---

## 1. Feature Definition

### What It Is

The Exam Readiness Score is a metric that predicts how prepared a student is for their upcoming exams. It's derived from mock test accuracy, syllabus coverage, and weak/strong chapter analysis.

### Goal

Create a backend API + frontend widget that displays:
- **Readiness Score** (0-100) — overall preparedness
- **Predicted Score** (0-100%) — expected marks based on mock performance
- **Weak Chapters** — list of chapters needing revision
- **Syllabus Coverage** (% of syllabus completed)

### MVP Scope (What We Build Now)

Since mock attempt data doesn't exist yet, build the scaffolding:
1. The **database table** to store computed readiness data
2. A **backend API** that returns readiness data for a student
3. A **seed data endpoint** (for demo without real data)
4. A **frontend widget** in the dashboard
5. **Dashboard integration** — replace the hardcoded stat + wire section

### Future Scope (Real Data)

- Computation from real mock attempt data
- Integration with Weakness Detection for accurate weak/strong chapter list
- Trending over time
- Daily readiness recalculation

---

## 2. Dependency Status

| Dependency | Status | Impact |
|-----------|--------|--------|
| Mock attempt tables + API | 🔜 Not built yet | MVP uses seed data |
| Weakness Detection Agent | 🔴 Blocked (Jatin) | Weak chapters = seed data for now |
| Student onboarding (already exists) | ✅ Complete | Can look up students |

---

## 3. Database Schema

### `exam_readiness` Table

```sql
CREATE TABLE IF NOT EXISTS exam_readiness (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE,
    readiness_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    predicted_score DECIMAL(5,2) DEFAULT 0.00,
    weak_chapters TEXT DEFAULT '[]',
    strong_chapters TEXT DEFAULT '[]',
    syllabus_coverage DECIMAL(5,2) DEFAULT 0.00,
    confidence_level VARCHAR(10) DEFAULT 'medium',
    mock_accuracy DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
```

---

## 4. API Contract

### `GET /api/readiness/{clerk_user_id}`

**Response 200:**
```json
{
  "student_id": "uuid-here",
  "clerk_user_id": "clerk_user_123",
  "readiness_score": 74.0,
  "predicted_score": 68.5,
  "weak_chapters": ["Electrostatics", "Organic Chemistry Basics"],
  "strong_chapters": ["Probability", "Calculus"],
  "syllabus_coverage": 65.0,
  "confidence_level": "medium",
  "mock_accuracy": 72.0,
  "last_updated": "2026-06-13T10:30:00Z"
}
```

### `POST /api/readiness/seed/{clerk_user_id}`

**Request Body:**
```json
{
  "readiness_score": 74.0,
  "predicted_score": 68.5,
  "weak_chapters": ["Electrostatics", "Organic Chemistry Basics"],
  "strong_chapters": ["Probability", "Calculus"],
  "syllabus_coverage": 65.0,
  "confidence_level": "medium"
}
```

---

## 5. Frontend Component Spec

### `ExamReadinessPanel` Component

States: **Loading** (skeleton cards), **Error** (message + retry), **Empty** (seed CTA), **Loaded** (metrics + weak chapters list).

Layout:
- 4 metric cards: Readiness Score (with color), Predicted Score, Weak Chapters count, Syllabus Coverage %
- Weak chapters list with warning badges
- Strong chapters list with success badges  
- Confidence level badge (low=red, medium=yellow, high=green)
- "Last updated" timestamp

### Dashboard Stats Integration

Replace the current hardcoded stat:
```
{ label: "Exam Readiness", value: "74%", detail: "Physics focus" }
```
→ Computed from API:
```
healthLoading ? "..."
  : healthData ? `${Math.round(healthData.readiness_score)}%`
  : "—"
```

---

## 6. Files to Create / Modify

### New Files (8)

| # | File | Purpose |
|---|------|---------|
| 1 | `backend/app/models/exam_readiness.py` | SQLAlchemy model |
| 2 | `backend/app/schemas/readiness.py` | Pydantic schemas |
| 3 | `backend/app/routes/readiness.py` | API endpoints |
| 4 | `backend/migrations/003_add_exam_readiness_table.sql` | DB migration |
| 5 | `frontend/hooks/use-exam-readiness.ts` | React hook |
| 6 | `frontend/components/dashboard/exam-readiness-panel.tsx` | Panel widget |
| 7 | `frontend/__tests__/components/exam-readiness-panel.test.tsx` | Frontend test |
| 8 | `backend/app/tests/test_readiness.py` | Backend test |

### Files to Modify (5)

| # | File | Change |
|---|------|--------|
| 1 | `backend/app/models/student.py` | Add `exam_readiness` relationship |
| 2 | `backend/app/models/__init__.py` | Export ExamReadiness |
| 3 | `backend/app/main.py` | Register readiness_router |
| 4 | `frontend/lib/api.ts` | Add readiness fetch + seed functions |
| 5 | `frontend/components/dashboard/mock-exam-dashboard.tsx` | Wire readiness stat + section |

---

## 7. Implementation Order

```
Milestone 1: Backend — Data Model + Migration
  Subtask 1.1: Create ExamReadiness model + export + migration SQL
  Subtask 1.2: Add exam_readiness relationship to Student model

Milestone 2: Backend — API
  Subtask 2.1: Create schemas (ReadinessResponse, SeedReadinessRequest)
  Subtask 2.2: Create POST seed + GET readiness endpoints
  Subtask 2.3: Register readiness_router in main.py

Milestone 3: Frontend — API Client + Hook
  Subtask 3.1: Add readiness fetch/seed to lib/api.ts
  Subtask 3.2: Create useExamReadiness hook

Milestone 4: Frontend — Dashboard Integration
  Subtask 4.1: Build ExamReadinessPanel component
  Subtask 4.2: Wire readiness stat card + section rendering in dashboard
```

---

## 8. Task Status Tracker

```
[ ] M1: Backend model + migration + student relationship
[ ] M2: Backend schemas + API routes + router registration
[ ] M3: Frontend API client + useExamReadiness hook
[ ] M4: ExamReadinessPanel component + dashboard integration
```
