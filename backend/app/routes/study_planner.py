import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.verify import get_current_user
from app.database import SessionLocal
from app.models.student import Student
from app.models.study_planner import StudyPlan, StudyTask
from app.models.user import User
from app.schemas.study_planner import (
    GeneratePlanRequest,
    StudyPlanResponse,
    StudyPlanSummary,
    StudyTaskResponse,
)
from app.services.study_planner import generate_plan

router = APIRouter(prefix="/api/study-planner", tags=["study-planner"])


# ── POST /generate ──────────────────────────────────────────────────────────


@router.post("/generate", response_model=StudyPlanResponse)
def trigger_generate(
    body: GeneratePlanRequest,
    verified_user_id: str = Depends(get_current_user),
):
    """Generate a new study plan. Deactivates any existing active plan."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        # Deactivate any existing active plans (all of them, not just the first)
        existing_actives = (
            db.query(StudyPlan)
            .filter(
                StudyPlan.student_id == student.id,
                StudyPlan.status == "active",
            )
            .all()
        )
        for p in existing_actives:
            p.status = "archived"

        plan = generate_plan(
            db=db,
            student=student,
            exam_dates=body.exam_dates,
            daily_hours=body.daily_hours,
            subject_focus=body.subject_focus,
        )

        return _plan_response(plan)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while generating study plan",
        )
    finally:
        db.close()


# ── GET /active ──────────────────────────────────────────────────────────────


@router.get("/active", response_model=StudyPlanResponse | dict)
def get_active_plan(
    verified_user_id: str = Depends(get_current_user),
):
    """Get the active plan for the current student, with tasks."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        plan = (
            db.query(StudyPlan)
            .filter(
                StudyPlan.student_id == student.id,
                StudyPlan.status == "active",
            )
            .first()
        )

        if not plan:
            return {}

        plan.tasks = (
            db.query(StudyTask)
            .filter(StudyTask.plan_id == plan.id)
            .order_by(StudyTask.day_number, StudyTask.duration_minutes.desc())
            .all()
        )

        return _plan_response(plan)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching active plan",
        )
    finally:
        db.close()


# ── GET /plans ──────────────────────────────────────────────────────────────


@router.get("/plans", response_model=list[StudyPlanSummary])
def list_plans(
    verified_user_id: str = Depends(get_current_user),
):
    """List all plans for the current student (summaries, no tasks)."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        plans = (
            db.query(StudyPlan)
            .filter(StudyPlan.student_id == student.id)
            .order_by(StudyPlan.generated_at.desc())
            .all()
        )

        result: list[StudyPlanSummary] = []
        for plan in plans:
            task_count = (
                db.query(StudyTask)
                .filter(StudyTask.plan_id == plan.id)
                .count()
            )
            completed_count = (
                db.query(StudyTask)
                .filter(
                    StudyTask.plan_id == plan.id,
                    StudyTask.completed.is_(True),
                )
                .count()
            )
            result.append(
                StudyPlanSummary(
                    id=plan.id,
                    name=plan.name,
                    total_days=plan.total_days,
                    generated_at=plan.generated_at.isoformat()
                    if plan.generated_at
                    else "",
                    status=plan.status,
                    tasks_completed=completed_count,
                    tasks_total=task_count,
                )
            )

        return result

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while listing plans",
        )
    finally:
        db.close()


# ── GET /plans/{plan_id} ────────────────────────────────────────────────────


@router.get("/plans/{plan_id}", response_model=StudyPlanResponse)
def get_plan_detail(
    plan_id: str,
    verified_user_id: str = Depends(get_current_user),
):
    """Get a specific plan with all tasks."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        plan = (
            db.query(StudyPlan)
            .filter(
                StudyPlan.id == plan_id,
                StudyPlan.student_id == student.id,
            )
            .first()
        )

        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        plan.tasks = (
            db.query(StudyTask)
            .filter(StudyTask.plan_id == plan.id)
            .order_by(StudyTask.day_number, StudyTask.duration_minutes.desc())
            .all()
        )

        return _plan_response(plan)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching plan",
        )
    finally:
        db.close()


# ── GET /plans/{plan_id}/today ──────────────────────────────────────────────


@router.get(
    "/plans/{plan_id}/today",
    response_model=list[StudyTaskResponse],
)
def get_today_tasks(
    plan_id: str,
    verified_user_id: str = Depends(get_current_user),
):
    """Get today's tasks for a specific plan."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        plan = (
            db.query(StudyPlan)
            .filter(
                StudyPlan.id == plan_id,
                StudyPlan.student_id == student.id,
            )
            .first()
        )

        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        today = date.today()
        tasks = (
            db.query(StudyTask)
            .filter(
                StudyTask.plan_id == plan.id,
                StudyTask.scheduled_date == today,
            )
            .order_by(StudyTask.duration_minutes.desc())
            .all()
        )

        return [_task_response(t) for t in tasks]

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching today's tasks",
        )
    finally:
        db.close()


# ── PATCH /tasks/{task_id} ────────────────────────────────────────────────────


class _PatchTaskRequest(BaseModel):
    completed: bool


@router.patch("/tasks/{task_id}", response_model=StudyTaskResponse)
def patch_task(
    task_id: str,
    body: _PatchTaskRequest,
    verified_user_id: str = Depends(get_current_user),
):
    """Mark a task as completed or incomplete."""
    db = SessionLocal()
    try:
        task = (
            db.query(StudyTask)
            .filter(StudyTask.id == task_id)
            .first()
        )
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        # Verify ownership via plan → student → user chain
        plan = (
            db.query(StudyPlan)
            .filter(StudyPlan.id == task.plan_id)
            .first()
        )
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")

        student = db.query(Student).filter(Student.id == plan.student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        user = (
            db.query(User)
            .filter(User.id == student.user_id, User.clerk_user_id == verified_user_id)
            .first()
        )
        if not user:
            raise HTTPException(status_code=403, detail="Not authorized to modify this task")

        task.completed = body.completed
        if body.completed:
            task.completed_at = datetime.utcnow()
        else:
            task.completed_at = None

        db.commit()
        db.refresh(task)

        return _task_response(task)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while updating task",
        )
    finally:
        db.close()


# ── POST /regenerate ────────────────────────────────────────────────────────


@router.post("/regenerate", response_model=StudyPlanResponse)
def regenerate_plan(
    body: GeneratePlanRequest,
    verified_user_id: str = Depends(get_current_user),
):
    """Regenerate plan: archive active, create new with different parameters."""
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)

        # Same as generate — deactivate any active plans first (all of them)
        existing_actives = (
            db.query(StudyPlan)
            .filter(
                StudyPlan.student_id == student.id,
                StudyPlan.status == "active",
            )
            .all()
        )
        for p in existing_actives:
            p.status = "archived"

        plan = generate_plan(
            db=db,
            student=student,
            exam_dates=body.exam_dates,
            daily_hours=body.daily_hours,
            subject_focus=body.subject_focus,
        )

        return _plan_response(plan)

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while regenerating study plan",
        )
    finally:
        db.close()


# ── Response Builders ────────────────────────────────────────────────────────


def _plan_response(plan: StudyPlan) -> StudyPlanResponse:
    return StudyPlanResponse(
        id=plan.id,
        name=plan.name,
        exam_dates=_parse_json_dict(plan.exam_dates),
        daily_hours=plan.daily_hours,
        total_days=plan.total_days,
        generated_at=plan.generated_at.isoformat() if plan.generated_at else "",
        status=plan.status,
        metrics_snapshot=_parse_json_dict(plan.metrics_snapshot),
        tasks=[_task_response(t) for t in (plan.tasks or [])],
    )


def _task_response(task: StudyTask) -> StudyTaskResponse:
    return StudyTaskResponse(
        id=task.id,
        scheduled_date=task.scheduled_date.isoformat()
        if hasattr(task.scheduled_date, "isoformat")
        else str(task.scheduled_date),
        day_number=task.day_number,
        subject=task.subject,
        chapter=task.chapter,
        unit=task.unit,
        task_type=task.task_type,
        duration_minutes=task.duration_minutes,
        priority_score=task.priority_score,
        session_label=task.session_label,
        description=task.description,
        completed=task.completed,
        completed_at=task.completed_at.isoformat()
        if task.completed_at
        else None,
    )


def _get_current_student(db, clerk_user_id: str) -> Student:
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


def _parse_json_dict(value: str) -> dict:
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except (json.JSONDecodeError, TypeError):
        return {}
