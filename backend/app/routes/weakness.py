from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.verify import get_current_user
from app.database import SessionLocal
from app.models.mock_exam import MockAttempt
from app.models.student import Student
from app.models.user import User
from app.models.weakness import WeaknessAnalysis, WeaknessItem
from app.schemas.weakness import (
    WeaknessAnalysisResponse,
    WeaknessItemResponse,
    WeaknessTrendPoint,
    WeaknessTrendResponse,
)
from app.services.weakness_analysis import analyze_student_weaknesses


router = APIRouter(prefix="/api/weakness", tags=["weakness"])


@router.post("/analyze", response_model=WeaknessAnalysisResponse)
def trigger_analysis(
    verified_user_id: str = Depends(get_current_user),
):
    """Run a fresh weakness analysis and persist the results."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        analysis = analyze_student_weaknesses(db, student)
        return _analysis_response(analysis)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while running weakness analysis",
        )
    finally:
        db.close()


@router.get("", response_model=WeaknessAnalysisResponse)
def get_latest_analysis(
    verified_user_id: str = Depends(get_current_user),
):
    """Get the most recent weakness analysis for the current student."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        analysis = (
            db.query(WeaknessAnalysis)
            .filter(WeaknessAnalysis.student_id == student.id)
            .order_by(WeaknessAnalysis.generated_at.desc())
            .first()
        )

        if not analysis:
            return WeaknessAnalysisResponse(
                id="",
                generated_at="",
                total_attempts_analyzed=0,
                overall_accuracy=0.0,
                overall_weakness_score=0.0,
                total_questions_analyzed=0,
                items=[],
            )

        # Eager load items
        analysis.items = (
            db.query(WeaknessItem)
            .filter(WeaknessItem.analysis_id == analysis.id)
            .all()
        )

        return _analysis_response(analysis)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching weakness analysis",
        )
    finally:
        db.close()


@router.get("/items", response_model=list[WeaknessItemResponse])
def get_weakness_items(
    severity: str | None = Query(default=None),
    category_type: str | None = Query(default=None),
    verified_user_id: str = Depends(get_current_user),
):
    """Get weakness items for the latest analysis, with optional filters."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        latest_analysis = (
            db.query(WeaknessAnalysis)
            .filter(WeaknessAnalysis.student_id == student.id)
            .order_by(WeaknessAnalysis.generated_at.desc())
            .first()
        )

        if not latest_analysis:
            return []

        query = db.query(WeaknessItem).filter(
            WeaknessItem.analysis_id == latest_analysis.id
        )

        if severity:
            query = query.filter(WeaknessItem.severity == severity)
        if category_type:
            query = query.filter(WeaknessItem.category_type == category_type)

        items = query.order_by(WeaknessItem.error_rate.desc()).all()

        return [_item_response(item) for item in items]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching weakness items",
        )
    finally:
        db.close()


@router.get("/trends", response_model=WeaknessTrendResponse)
def get_weakness_trends(
    subject: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    verified_user_id: str = Depends(get_current_user),
):
    """Get per-attempt score trends over time for analysis."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        query = db.query(MockAttempt).filter(
            MockAttempt.student_id == student.id,
            MockAttempt.status == "submitted",
        )

        if subject:
            query = query.filter(MockAttempt.subject == subject)

        attempts = query.order_by(MockAttempt.submitted_at.desc()).limit(limit).all()

        return WeaknessTrendResponse(
            trends=[
                WeaknessTrendPoint(
                    attempt_id=a.id,
                    subject=a.subject,
                    chapter=a.chapter,
                    score_percentage=a.score_percentage,
                    correct_count=a.correct_count,
                    total_questions=a.total_questions,
                    submitted_at=a.submitted_at.isoformat() if a.submitted_at else "",
                )
                for a in attempts
            ]
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching weakness trends",
        )
    finally:
        db.close()


def _get_current_student(db, clerk_user_id: str) -> Student:
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


def _item_response(item: WeaknessItem) -> WeaknessItemResponse:
    return WeaknessItemResponse(
        category_type=item.category_type,
        category_name=item.category_name,
        subject=item.subject,
        total_questions=item.total_questions,
        incorrect_count=item.incorrect_count,
        error_rate=item.error_rate,
        avg_time_spent=item.avg_time_spent,
        severity=item.severity,
        frequency_score=item.frequency_score,
        importance_score=item.importance_score,
        recommendation=item.recommendation,
    )


def _analysis_response(analysis: WeaknessAnalysis) -> WeaknessAnalysisResponse:
    return WeaknessAnalysisResponse(
        id=analysis.id,
        generated_at=analysis.generated_at.isoformat() if analysis.generated_at else "",
        total_attempts_analyzed=analysis.total_attempts_analyzed,
        overall_accuracy=analysis.overall_accuracy,
        overall_weakness_score=analysis.overall_weakness_score,
        total_questions_analyzed=analysis.total_questions_analyzed,
        items=[_item_response(item) for item in (analysis.items or [])],
    )
