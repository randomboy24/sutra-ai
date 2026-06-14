from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.mock_exam import Question
from app.models.weakness import WeaknessAnalysis, WeaknessItem


# Severity → multiplier mapping
_WEAKNESS_MULTIPLIERS: dict[str, float] = {
    "critical": 1.5,
    "high": 1.3,
    "medium": 1.1,
    "low": 1.0,
}

_RAW_PRIORITY_WEIGHT_FREQUENCY = 0.6
_RAW_PRIORITY_WEIGHT_IMPORTANCE = 0.4


def _raw_priority_score(frequency_score: float, importance_score: float) -> float:
    return round(
        frequency_score * _RAW_PRIORITY_WEIGHT_FREQUENCY
        + importance_score * _RAW_PRIORITY_WEIGHT_IMPORTANCE,
        4,
    )


def _build_weakness_chapter_map(
    db: Session, student_id: str
) -> dict[str, float] | None:
    """Build a map of chapter → weakness multiplier from the latest analysis.

    Returns None if no analysis exists, otherwise a dict like:
        {"Electrostatics": 1.3, "Thermodynamics": 1.5}
    """
    latest_analysis = (
        db.query(WeaknessAnalysis)
        .filter(WeaknessAnalysis.student_id == student_id)
        .order_by(WeaknessAnalysis.generated_at.desc())
        .first()
    )
    if not latest_analysis:
        return None

    chapter_items = (
        db.query(WeaknessItem)
        .filter(
            WeaknessItem.analysis_id == latest_analysis.id,
            WeaknessItem.category_type == "chapter",
        )
        .all()
    )
    if not chapter_items:
        return None

    return {
        item.category_name: _WEAKNESS_MULTIPLIERS.get(item.severity, 1.0)
        for item in chapter_items
    }


def get_recommended_questions(
    db: Session,
    student_id: str,
    board: str,
    class_level: str,
    stream: str | None,
    *,
    subject: str | None = None,
    difficulty: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """Return recommended questions ranked by personalized priority.

    If no weakness data exists, falls back to the generic priority_score sort.
    """
    # 1. Build weakness chapter map (or None if no data)
    chapter_multiplier_map = _build_weakness_chapter_map(db, student_id)

    # 2. Query active questions matching student profile
    query = db.query(Question).filter(
        Question.board == board,
        Question.class_level == class_level,
        Question.is_active.is_(True),
    )
    if stream:
        query = query.filter(Question.stream == stream)
    if subject:
        query = query.filter(Question.subject == subject)
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)

    questions = query.all()

    # 3. Compute personalized score for each question
    scored_questions: list[dict] = []
    for question in questions:
        raw = _raw_priority_score(question.frequency_score, question.importance_score)

        if chapter_multiplier_map is not None:
            multiplier = chapter_multiplier_map.get(question.chapter, 1.0)
        else:
            multiplier = 1.0

        personalized_score = round(raw * multiplier, 4)

        scored_questions.append(
            {
                "question": question,
                "personalized_score": personalized_score,
            }
        )

    # 4. Sort by personalized_score descending, limit
    scored_questions.sort(key=lambda x: x["personalized_score"], reverse=True)
    return scored_questions[:limit]
