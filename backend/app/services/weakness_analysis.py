"""Weakness Detection Analysis Engine.

Analyzes mock attempt answers across multiple dimensions to identify
student weaknesses: chapter, unit, difficulty, question type,
distractor patterns, and time efficiency.
"""

from collections import defaultdict
from uuid import uuid4

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.mock_exam import MockAttempt, MockAttemptAnswer, Question, QuestionOption
from app.models.student import Student
from app.models.weakness import WeaknessAnalysis, WeaknessItem


def analyze_student_weaknesses(
    db: Session, student: Student, max_attempts: int = 50
) -> WeaknessAnalysis:
    """Run a full weakness analysis for a student and persist results.

    Args:
        db: Active database session.
        student: The Student to analyze.
        max_attempts: Maximum number of recent attempts to consider.

    Returns:
        The newly created WeaknessAnalysis with items loaded.
    """
    # 1. Fetch recent attempts with answers and questions
    attempts = (
        db.query(MockAttempt)
        .filter(
            MockAttempt.student_id == student.id,
            MockAttempt.status == "submitted",
        )
        .order_by(desc(MockAttempt.submitted_at))
        .limit(max_attempts)
        .all()
    )

    if not attempts:
        analysis = WeaknessAnalysis(
            student_id=student.id,
            total_attempts_analyzed=0,
            overall_accuracy=0.0,
            overall_weakness_score=0.0,
            total_questions_analyzed=0,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    # 2. Collect all answer data with joined question info
    answer_data = _collect_answer_data(db, attempts)

    if not answer_data:
        analysis = WeaknessAnalysis(
            student_id=student.id,
            total_attempts_analyzed=len(attempts),
            overall_accuracy=0.0,
            overall_weakness_score=0.0,
            total_questions_analyzed=0,
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis

    # 3. Compute overall stats
    total_questions = len(answer_data)
    correct_count = sum(
        1 for a in answer_data if a["is_correct"] is True
    )
    incorrect_count = sum(
        1 for a in answer_data if a["is_correct"] is False
    )
    scorable_total = correct_count + incorrect_count
    overall_accuracy = round(correct_count / scorable_total, 4) if scorable_total else 0.0
    overall_weakness_score = round(incorrect_count / scorable_total, 4) if scorable_total else 0.0

    # 4. Compute per-dimension metrics
    dimension_items = _compute_dimension_analysis(answer_data)

    # 5. Persist
    analysis = WeaknessAnalysis(
        student_id=student.id,
        total_attempts_analyzed=len(attempts),
        overall_accuracy=overall_accuracy,
        overall_weakness_score=overall_weakness_score,
        total_questions_analyzed=total_questions,
    )
    db.add(analysis)
    db.flush()

    for item_data in dimension_items:
        item = WeaknessItem(
            analysis_id=analysis.id,
            **item_data,
        )
        db.add(item)

    db.commit()
    db.refresh(analysis)

    # Eagerly load items for the response
    analysis.items = (
        db.query(WeaknessItem)
        .filter(WeaknessItem.analysis_id == analysis.id)
        .all()
    )

    return analysis


def _collect_answer_data(
    db: Session, attempts: list[MockAttempt]
) -> list[dict]:
    """Flatten attempt answers into a list of dicts with question metadata."""
    attempt_ids = [a.id for a in attempts]

    answers = (
        db.query(MockAttemptAnswer)
        .filter(MockAttemptAnswer.attempt_id.in_(attempt_ids))
        .all()
    )

    if not answers:
        return []

    question_ids = list({a.question_id for a in answers if a.question_id})
    questions = {
        q.id: q
        for q in (
            db.query(Question)
            .filter(Question.id.in_(question_ids), Question.is_active.is_(True))
            .all()
        )
    }

    # Also fetch wrong-option labels for distractor analysis
    wrong_option_ids = [
        a.selected_option_id
        for a in answers
        if a.selected_option_id and a.is_correct is False
    ]
    wrong_options = {}
    if wrong_option_ids:
        for opt in (
            db.query(QuestionOption)
            .filter(QuestionOption.id.in_(wrong_option_ids))
            .all()
        ):
            wrong_options[opt.id] = opt.label

    attempt_lookup = {a.id: a for a in attempts}

    result = []
    for answer in answers:
        question = questions.get(answer.question_id)
        if not question:
            continue

        attempt = attempt_lookup.get(answer.attempt_id)

        result.append(
            {
                "is_correct": answer.is_correct,
                "time_spent_seconds": answer.time_spent_seconds,
                "score_awarded": answer.score_awarded,
                "max_score": answer.max_score,
                "subject": question.subject,
                "chapter": question.chapter,
                "unit": question.unit,
                "difficulty": question.difficulty,
                "question_type": question.question_type,
                "frequency_score": question.frequency_score,
                "importance_score": question.importance_score,
                "selected_option_id": answer.selected_option_id,
                "wrong_option_label": wrong_options.get(answer.selected_option_id) if answer.selected_option_id else None,
                "submitted_at": attempt.submitted_at if attempt else None,
                "attempt_id": attempt.id if attempt else None,
                "score_percentage": attempt.score_percentage if attempt else None,
            }
        )

    return result


def _compute_dimension_analysis(
    answer_data: list[dict],
) -> list[dict]:
    """Compute weakness items across chapter, unit, difficulty, and question type dimensions."""
    items = []

    # Dimension configurations: (category_type, key_in_answer_data)
    dimensions = [
        ("chapter", "chapter"),
        ("unit", "unit"),
        ("difficulty", "difficulty"),
        ("question_type", "question_type"),
    ]

    for category_type, key in dimensions:
        groups = defaultdict(list)
        for entry in answer_data:
            value = entry.get(key)
            if value:
                subject = entry.get("subject", "unknown")
                groups[(subject, value)].append(entry)

        for (subject_val, category_name), entries in sorted(groups.items()):
            item = _build_weakness_item(
                category_type=category_type,
                category_name=str(category_name),
                subject=subject_val,
                entries=entries,
            )
            if item:
                items.append(item)

    return items


def _build_weakness_item(
    category_type: str,
    category_name: str,
    subject: str,
    entries: list[dict],
) -> dict | None:
    """Build a single weakness item dict from grouped answer entries."""
    total = len(entries)
    incorrect = sum(1 for e in entries if e["is_correct"] is False)
    correct = sum(1 for e in entries if e["is_correct"] is True)

    # Only consider entries where is_correct is not null
    scorable = incorrect + correct
    if scorable == 0:
        return None

    error_rate = round(incorrect / scorable, 4)

    # Average time spent (only for entries with time data)
    times = [e["time_spent_seconds"] for e in entries if e["time_spent_seconds"] is not None]
    avg_time = round(sum(times) / len(times), 1) if times else None

    # Average frequency and importance scores
    freq_scores = [e["frequency_score"] for e in entries if e.get("frequency_score")]
    imp_scores = [e["importance_score"] for e in entries if e.get("importance_score")]
    avg_freq = round(sum(freq_scores) / len(freq_scores), 2) if freq_scores else 0.0
    avg_imp = round(sum(imp_scores) / len(imp_scores), 2) if imp_scores else 0.0

    severity = _classify_severity(error_rate)
    recommendation = _generate_recommendation(category_type, category_name, error_rate)

    return {
        "category_type": category_type,
        "category_name": category_name,
        "subject": subject,
        "total_questions": total,
        "incorrect_count": incorrect,
        "error_rate": error_rate,
        "avg_time_spent": avg_time,
        "severity": severity,
        "frequency_score": avg_freq,
        "importance_score": avg_imp,
        "recommendation": recommendation,
    }


def _classify_severity(error_rate: float) -> str:
    """Classify weakness severity based on error rate."""
    if error_rate >= 0.8:
        return "critical"
    if error_rate >= 0.6:
        return "high"
    if error_rate >= 0.4:
        return "medium"
    return "low"


def _generate_recommendation(
    category_type: str, category_name: str, error_rate: float
) -> str:
    """Generate a rule-based recommendation for a weakness item."""
    if error_rate >= 0.8:
        return (
            f"Critical weakness in {category_name}. "
            f"Revise foundational concepts and practice targeted questions daily."
        )
    if error_rate >= 0.6:
        return (
            f"Focus on revising {category_name} fundamentals. "
            f"Practice more questions to improve understanding."
        )
    if error_rate >= 0.4:
        return (
            f"Review {category_name} concepts and practice "
            f"targeted exercises to strengthen this area."
        )
    return (
        f"Keep up the good work in {category_name}. "
        f"Regular revision will maintain your strength."
    )
