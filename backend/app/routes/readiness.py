import json

from fastapi import APIRouter, Depends, HTTPException

from app.auth.verify import get_current_user
from app.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.exam_readiness import ExamReadiness
from app.schemas.readiness import (
    SeedReadinessRequest,
    SeedReadinessResponse,
    ReadinessResponse,
)

router = APIRouter(prefix="/api/readiness", tags=["readiness"])


@router.post("/seed", response_model=SeedReadinessResponse)
async def seed_readiness_data(
    body: SeedReadinessRequest,
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.clerk_user_id == verified_user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        student = (
            db.query(Student)
            .filter(Student.user_id == user.id)
            .first()
        )
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        existing = (
            db.query(ExamReadiness)
            .filter(ExamReadiness.student_id == student.id)
            .first()
        )

        weak_chapters_json = json.dumps(body.weak_chapters)
        strong_chapters_json = json.dumps(body.strong_chapters)

        if existing:
            existing.readiness_score = body.readiness_score
            existing.predicted_score = body.predicted_score
            existing.weak_chapters = weak_chapters_json
            existing.strong_chapters = strong_chapters_json
            existing.syllabus_coverage = body.syllabus_coverage
            existing.confidence_level = body.confidence_level
        else:
            readiness = ExamReadiness(
                student_id=student.id,
                readiness_score=body.readiness_score,
                predicted_score=body.predicted_score,
                weak_chapters=weak_chapters_json,
                strong_chapters=strong_chapters_json,
                syllabus_coverage=body.syllabus_coverage,
                confidence_level=body.confidence_level,
            )
            db.add(readiness)

        db.commit()
        return SeedReadinessResponse(success=True, message="Readiness data seeded")

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while seeding readiness data",
        )
    finally:
        db.close()


@router.get("", response_model=ReadinessResponse)
async def get_readiness(
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        user = (
            db.query(User)
            .filter(User.clerk_user_id == verified_user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        readiness = (
            db.query(ExamReadiness)
            .join(Student, ExamReadiness.student_id == Student.id)
            .filter(Student.user_id == user.id)
            .first()
        )
        if not readiness:
            raise HTTPException(
                status_code=404,
                detail="Readiness data not found. Seed some data first.",
            )

        return ReadinessResponse(
            student_id=readiness.student_id,
            clerk_user_id=verified_user_id,
            readiness_score=readiness.readiness_score,
            predicted_score=readiness.predicted_score,
            weak_chapters=json.loads(readiness.weak_chapters),
            strong_chapters=json.loads(readiness.strong_chapters),
            syllabus_coverage=readiness.syllabus_coverage,
            confidence_level=readiness.confidence_level,
            mock_accuracy=readiness.mock_accuracy,
            last_updated=readiness.last_updated.isoformat()
            if readiness.last_updated
            else None,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching readiness data",
        )
    finally:
        db.close()
