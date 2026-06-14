from fastapi import APIRouter, Depends, HTTPException

from app.auth.verify import get_current_user
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.academic_health import AcademicHealth
from app.schemas.health import (
    SeedHealthRequest,
    SeedHealthResponse,
    HealthResponse,
)

router = APIRouter(prefix="/api/health", tags=["health"])


@router.post("/seed", response_model=SeedHealthResponse)
def seed_health_data(
    body: SeedHealthRequest,
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.clerk_user_id == verified_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        student = db.query(Student).filter(Student.user_id == user.id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        existing = (
            db.query(AcademicHealth)
            .filter(AcademicHealth.student_id == student.id)
            .first()
        )

        if existing:
            existing.health_score = body.health_score
            existing.trend = body.trend
            existing.study_hours_week = body.study_hours_week
            existing.revision_frequency = body.revision_frequency
            existing.engagement_streak = body.engagement_streak
        else:
            health = AcademicHealth(
                student_id=student.id,
                health_score=body.health_score,
                trend=body.trend,
                study_hours_week=body.study_hours_week,
                revision_frequency=body.revision_frequency,
                engagement_streak=body.engagement_streak,
            )
            db.add(health)

        db.commit()
        return SeedHealthResponse(success=True, message="Health data seeded")

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while seeding health data",
        )
    finally:
        db.close()


@router.get("", response_model=HealthResponse)
def get_health(
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.clerk_user_id == verified_user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        health = (
            db.query(AcademicHealth)
            .join(Student, AcademicHealth.student_id == Student.id)
            .filter(Student.user_id == user.id)
            .first()
        )
        if not health:
            raise HTTPException(
                status_code=404,
                detail="Health data not found. Seed some data first.",
            )

        return HealthResponse(
            student_id=health.student_id,
            clerk_user_id=verified_user_id,
            health_score=health.health_score,
            trend=health.trend,
            study_hours_week=health.study_hours_week,
            revision_frequency=health.revision_frequency,
            engagement_streak=health.engagement_streak,
            mock_accuracy=health.mock_accuracy,
            last_updated=health.last_updated.isoformat()
            if health.last_updated
            else None,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching health data",
        )
    finally:
        db.close()
