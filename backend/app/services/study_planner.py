"""Autonomous Study Planner — Rule-Based Scheduling Engine.

Generates a day-by-day study schedule from weakness data, exam dates,
academic health, and available study hours. All algorithmic, no LLM.
"""

import json
from datetime import date, datetime, timedelta
from uuid import uuid4

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.academic_health import AcademicHealth
from app.models.exam_readiness import ExamReadiness
from app.models.mock_exam import Question
from app.models.student import Student
from app.models.study_planner import StudyPlan, StudyTask
from app.models.weakness import WeaknessAnalysis, WeaknessItem

# ── Constants ────────────────────────────────────────────────────────────────

_MIN_SLOT_MINUTES = 30
_MAX_WEAK_CHAPTERS = 15
_DEFAULT_TOTAL_DAYS = 30

_SEVERITY_MULTIPLIERS: dict[str, float] = {
    "critical": 1.5,
    "high": 1.3,
    "medium": 1.1,
    "low": 1.0,
}

_STRONG_CHAPTER_MAINTENANCE_PCT = 0.15
_MOCK_EXAM_INTERVAL_DAYS = 7
_PRACTICE_INTERVAL_DAYS = 3
_MOCK_EXAM_DURATION_MINUTES = 50
_PRACTICE_DURATION_MINUTES = 20
_STRONG_REVIEW_MINUTES = 12

# ── Severity → label for descriptions ────────────────────────────────────────

_SEVERITY_LABELS: dict[str, str] = {
    "critical": "Critical weakness — revise fundamentals",
    "high": "Significant weakness — focused practice needed",
    "medium": "Moderate weakness — review and practice",
    "low": "Minor weakness — light revision",
}


# ── Public API ───────────────────────────────────────────────────────────────


def generate_plan(
    db: Session,
    student: Student,
    exam_dates: dict[str, str] | None = None,
    daily_hours: float = 2.0,
    subject_focus: list[str] | None = None,
) -> StudyPlan:
    """Generate and persist a new study plan for the student.

    Orchestrates: fetch weakness data → compute priorities →
    build schedule → persist → return.
    """
    if exam_dates is None:
        exam_dates = {}

    start_date = date.today()
    total_days = _compute_total_days(exam_dates, start_date)

    # Gather input data
    weakness_items = _fetch_chapter_weakness_items(db, student.id)
    health_data = _fetch_health_data(db, student.id)
    readiness_data = _fetch_readiness_data(db, student.id)
    strong_chapters = _parse_json_list(readiness_data.get("strong_chapters", "[]")) if readiness_data else []
    subjects = _fetch_subject_list(db, student)

    # Compute priorities
    chapter_priorities = _compute_chapter_priorities(
        weakness_items=weakness_items,
        strong_chapters=strong_chapters,
        exam_dates=exam_dates,
        health_data=health_data,
        start_date=start_date,
        subject_focus=subject_focus or [],
    )

    # Build daily schedule
    tasks = _build_daily_schedule(
        chapter_priorities=chapter_priorities,
        strong_chapters=strong_chapters,
        all_subjects=subjects,
        total_days=total_days,
        daily_hours=daily_hours,
        start_date=start_date,
        exam_dates=exam_dates,
        has_weakness_data=bool(weakness_items),
    )

    # Build metrics snapshot
    metrics_snapshot = {
        "weakness_items_count": len(weakness_items),
        "chapter_priorities_count": len(chapter_priorities),
        "overall_weakness_score": health_data.get("overall_weakness_score", None),
        "engagement_streak": health_data.get("engagement_streak", 0),
        "readiness_score": readiness_data.get("readiness_score", None),
    }

    # Build auto-generated name
    end_date = start_date + timedelta(days=total_days - 1)
    name = f"Plan: {start_date.strftime('%b %d')} – {end_date.strftime('%b %d')}"

    # Persist
    plan = StudyPlan(
        student_id=student.id,
        name=name,
        exam_dates=json.dumps(exam_dates),
        daily_hours=daily_hours,
        total_days=total_days,
        status="active",
        metrics_snapshot=json.dumps(metrics_snapshot),
    )
    db.add(plan)
    db.flush()

    for task_data in tasks:
        task = StudyTask(
            plan_id=plan.id,
            **task_data,
        )
        db.add(task)

    db.commit()
    db.refresh(plan)

    # Eager-load tasks for the response
    plan.tasks = (
        db.query(StudyTask)
        .filter(StudyTask.plan_id == plan.id)
        .order_by(StudyTask.day_number, StudyTask.duration_minutes.desc())
        .all()
    )

    return plan


# ── Data Fetching ────────────────────────────────────────────────────────────


def _fetch_chapter_weakness_items(db: Session, student_id: str) -> list[WeaknessItem]:
    """Get chapter-level weakness items from the latest analysis."""
    latest = (
        db.query(WeaknessAnalysis)
        .filter(WeaknessAnalysis.student_id == student_id)
        .order_by(desc(WeaknessAnalysis.generated_at))
        .first()
    )
    if not latest:
        return []

    return (
        db.query(WeaknessItem)
        .filter(
            WeaknessItem.analysis_id == latest.id,
            WeaknessItem.category_type == "chapter",
        )
        .all()
    )


def _fetch_health_data(db: Session, student_id: str) -> dict:
    """Fetch academic health data, returning defaults if none exists."""
    health = (
        db.query(AcademicHealth)
        .filter(AcademicHealth.student_id == student_id)
        .first()
    )
    if not health:
        return {
            "engagement_streak": 0,
            "study_hours_week": 10.0,
            "overall_weakness_score": None,
        }
    return {
        "engagement_streak": health.engagement_streak or 0,
        "study_hours_week": health.study_hours_week or 10.0,
        "overall_weakness_score": None,
    }


def _fetch_readiness_data(db: Session, student_id: str) -> dict | None:
    """Fetch exam readiness data, returning None if none exists."""
    readiness = (
        db.query(ExamReadiness)
        .filter(ExamReadiness.student_id == student_id)
        .first()
    )
    if not readiness:
        return None
    return {
        "readiness_score": readiness.readiness_score,
        "weak_chapters": readiness.weak_chapters,
        "strong_chapters": readiness.strong_chapters,
    }


def _fetch_subject_list(db: Session, student: Student) -> list[str]:
    """Get distinct subjects available for this student's board/class/stream."""
    query = (
        db.query(Question.subject)
        .filter(
            Question.board == student.board,
            Question.class_level == student.class_level,
            Question.is_active.is_(True),
        )
        .distinct()
    )
    if student.stream:
        query = query.filter(Question.stream == student.stream)
    return [row[0] for row in query.all()]


# ── Priority Computation ────────────────────────────────────────────────────


def _compute_chapter_priorities(
    weakness_items: list[WeaknessItem],
    strong_chapters: list[str],
    exam_dates: dict[str, str],
    health_data: dict,
    start_date: date,
    subject_focus: list[str],
) -> list[dict]:
    """Compute priority scores for each (subject, chapter) pair.

    Returns a list sorted by priority descending, capped at _MAX_WEAK_CHAPTERS.
    """
    if not weakness_items:
        return []

    consistency_bonus = _compute_consistency_bonus(health_data.get("engagement_streak", 0))

    priorities: list[dict] = []
    for item in weakness_items:
        severity = item.severity or "low"
        severity_weight = _SEVERITY_MULTIPLIERS.get(severity, 1.0)
        error_rate_multiplier = 1.0 + (item.error_rate * 0.5)
        weakness_multiplier = severity_weight * error_rate_multiplier

        exam_urgency = _compute_exam_urgency(
            item.subject, exam_dates, start_date
        )

        priority = round(weakness_multiplier * exam_urgency * consistency_bonus, 4)

        # Subject focus bonus: 1.2x if this subject was requested
        if item.subject in subject_focus:
            priority = round(priority * 1.2, 4)

        priorities.append({
            "subject": item.subject,
            "chapter": item.category_name,
            "error_rate": item.error_rate,
            "severity": severity,
            "priority": priority,
            "recommendation": item.recommendation or "",
        })

    priorities.sort(key=lambda p: p["priority"], reverse=True)
    return priorities[:_MAX_WEAK_CHAPTERS]


def _compute_consistency_bonus(engagement_streak: int) -> float:
    """0.9 for streak=0, scaling to 1.0 for streak=30+."""
    capped = min(engagement_streak, 30)
    return round(0.9 + (capped / 300), 4)


def _compute_exam_urgency(
    subject: str, exam_dates: dict[str, str], start_date: date
) -> float:
    """1.5 when 30+ days out, approaching 1.0 on exam day."""
    subject_dates = [
        d for s, d in exam_dates.items() if s.lower() == subject.lower()
    ]
    if not subject_dates:
        return 1.0

    try:
        exam_date = datetime.strptime(subject_dates[0], "%Y-%m-%d").date()
    except (ValueError, IndexError):
        return 1.0

    days_remaining = (exam_date - start_date).days
    if days_remaining <= 0:
        return 1.0
    return round(1.0 + (30 - min(days_remaining, 30)) / 60, 4)


def _compute_total_days(exam_dates: dict[str, str], start_date: date) -> int:
    """Determine plan duration from exam dates or default."""
    if not exam_dates:
        return _DEFAULT_TOTAL_DAYS

    parsed_dates: list[date] = []
    for d in exam_dates.values():
        try:
            parsed_dates.append(datetime.strptime(d, "%Y-%m-%d").date())
        except (ValueError, TypeError):
            continue

    if not parsed_dates:
        return _DEFAULT_TOTAL_DAYS

    min_days = min((d - start_date).days for d in parsed_dates)
    return max(min_days, 1)


# ── Daily Schedule Builder ──────────────────────────────────────────────────


def _build_daily_schedule(
    chapter_priorities: list[dict],
    strong_chapters: list[str],
    all_subjects: list[str],
    total_days: int,
    daily_hours: float,
    start_date: date,
    exam_dates: dict[str, str],
    has_weakness_data: bool,
) -> list[dict]:
    """Build a flat list of task dicts for the entire plan duration."""
    tasks: list[dict] = []
    daily_minutes = int(daily_hours * 60)
    daily_slots = max(1, daily_minutes // _MIN_SLOT_MINUTES)

    for day in range(total_days):
        day_date = start_date + timedelta(days=day)
        day_number = day + 1

        # Determine bucket allocation for this day
        is_cram_mode = (total_days - day) <= 7
        buckets = _allocate_daily_buckets(daily_minutes, is_cram_mode)

        # Select chapters for today (rotation)
        if chapter_priorities:
            today_chapters = _select_chapters_for_day(
                chapter_priorities, day, daily_slots
            )
        else:
            today_chapters = []

        # Sort today's chapters by priority descending
        today_chapters.sort(key=lambda c: c["priority"], reverse=True)

        # Day of week for mock exam scheduling
        day_of_week = day_date.weekday()  # Monday=0, Sunday=6

        # Allocate time to each bucket
        remaining_study = buckets["study"]

        # 1. Strong chapter maintenance (if any)
        strong_minutes = 0
        if strong_chapters and remaining_study > 0:
            strong_minutes = min(
                int(remaining_study * _STRONG_CHAPTER_MAINTENANCE_PCT),
                _STRONG_REVIEW_MINUTES,
            )
            if strong_minutes >= _MIN_SLOT_MINUTES:
                strong_chapter = strong_chapters[day % len(strong_chapters)]
                tasks.append({
                    "scheduled_date": day_date,
                    "day_number": day_number,
                    "subject": "",
                    "chapter": strong_chapter,
                    "unit": None,
                    "task_type": "review",
                    "duration_minutes": strong_minutes,
                    "priority_score": 0.0,
                    "session_label": f"Review: {strong_chapter}",
                    "description": f"Quick revision of {strong_chapter} to maintain proficiency.",
                    "completed": False,
                    "completed_at": None,
                })
                remaining_study -= strong_minutes

        # 2. Weak chapter study tasks
        if today_chapters and remaining_study >= _MIN_SLOT_MINUTES:
            per_chapter = max(_MIN_SLOT_MINUTES, remaining_study // len(today_chapters))
            for chapter_info in today_chapters:
                if remaining_study < _MIN_SLOT_MINUTES:
                    break
                minutes = min(per_chapter, remaining_study)
                severity_label = _SEVERITY_LABELS.get(
                    chapter_info["severity"], "Needs attention"
                )
                description = (
                    f"{severity_label}. "
                    f"Error rate: {chapter_info['error_rate']:.0%}. "
                    f"{chapter_info['recommendation']}"
                ).strip()

                tasks.append({
                    "scheduled_date": day_date,
                    "day_number": day_number,
                    "subject": chapter_info["subject"],
                    "chapter": chapter_info["chapter"],
                    "unit": None,
                    "task_type": "study",
                    "duration_minutes": minutes,
                    "priority_score": chapter_info["priority"],
                    "session_label": f"Study: {chapter_info['chapter']} ({chapter_info['subject'].title()})",
                    "description": description,
                    "completed": False,
                    "completed_at": None,
                })
                remaining_study -= minutes

        # 3. Practice task (every N days)
        if buckets["practice"] >= _MIN_SLOT_MINUTES and day_number % _PRACTICE_INTERVAL_DAYS == 0:
            # Pick the highest-priority subject for practice
            practice_subject = (
                today_chapters[0]["subject"] if today_chapters
                else (all_subjects[day % len(all_subjects)] if all_subjects else "")
            )
            tasks.append({
                "scheduled_date": day_date,
                "day_number": day_number,
                "subject": practice_subject,
                "chapter": None,
                "unit": None,
                "task_type": "practice",
                "duration_minutes": _PRACTICE_DURATION_MINUTES,
                "priority_score": 0.0,
                "session_label": f"Practice: {practice_subject.title()}",
                "description": f"Solve recommended practice questions in {practice_subject.title()} based on your weak areas.",
                "completed": False,
                "completed_at": None,
            })

        # 4. Mock exam task (every N days, Sunday preference)
        if day_of_week == 6 and day_number % _MOCK_EXAM_INTERVAL_DAYS == 0:
            mock_subject = (
                today_chapters[0]["subject"] if today_chapters
                else (all_subjects[day % len(all_subjects)] if all_subjects else "")
            )
            tasks.append({
                "scheduled_date": day_date,
                "day_number": day_number,
                "subject": mock_subject,
                "chapter": None,
                "unit": None,
                "task_type": "mock_exam",
                "duration_minutes": _MOCK_EXAM_DURATION_MINUTES,
                "priority_score": 0.0,
                "session_label": "Mock Exam",
                "description": f"Full mock exam in {mock_subject.title()} to assess current readiness.",
                "completed": False,
                "completed_at": None,
            })

        # If no tasks were allocated for this day (shouldn't happen), add a fallback
        if not any(t["day_number"] == day_number for t in tasks):
            fallback_subject = all_subjects[day % len(all_subjects)] if all_subjects else ""
            tasks.append({
                "scheduled_date": day_date,
                "day_number": day_number,
                "subject": fallback_subject,
                "chapter": None,
                "unit": None,
                "task_type": "study",
                "duration_minutes": daily_minutes,
                "priority_score": 0.0,
                "session_label": f"Study: {fallback_subject.title()}",
                "description": f"General study session for {fallback_subject.title()}.",
                "completed": False,
                "completed_at": None,
            })

    return tasks


def _allocate_daily_buckets(
    total_minutes: int, is_cram_mode: bool
) -> dict[str, int]:
    """Split daily minutes into study/practice/review/mock buckets."""
    if is_cram_mode:
        study_pct = 0.20
        practice_pct = 0.25
        review_pct = 0.25
        mock_pct = 0.30
    else:
        study_pct = 0.40
        practice_pct = 0.30
        review_pct = 0.20
        mock_pct = 0.10

    return {
        "study": max(0, int(total_minutes * study_pct)),
        "practice": max(0, int(total_minutes * practice_pct)),
        "review": max(0, int(total_minutes * review_pct)),
        "mock": max(0, int(total_minutes * mock_pct)),
    }


def _select_chapters_for_day(
    chapter_priorities: list[dict], day: int, daily_slots: int
) -> list[dict]:
    """Select which chapters to cover today based on rotation strategy.

    If chapters fit in one day, include all. Otherwise rotate.
    """
    count = len(chapter_priorities)
    if count <= daily_slots:
        return list(chapter_priorities)

    # Rotation: alternate groups across days
    group_size = daily_slots
    total_groups = (count + group_size - 1) // group_size  # Ceiling division

    group_index = day % total_groups
    start = group_index * group_size
    end = min(start + group_size, count)
    return chapter_priorities[start:end]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _parse_json_list(value: str) -> list[str]:
    """Safely parse a JSON string list, returning [] on failure."""
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
        return []
    except (json.JSONDecodeError, TypeError):
        return []
