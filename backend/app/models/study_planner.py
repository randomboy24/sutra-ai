from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    student_id: Mapped[str] = mapped_column(
        ForeignKey("students.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    exam_dates: Mapped[str] = mapped_column(
        Text, default="{}", nullable=False
    )
    daily_hours: Mapped[float] = mapped_column(
        Float, default=2.0, nullable=False
    )
    total_days: Mapped[int] = mapped_column(
        Integer, default=30, nullable=False
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    status: Mapped[str] = mapped_column(
        String, default="active", nullable=False
    )
    metrics_snapshot: Mapped[str] = mapped_column(
        Text, default="{}", nullable=False
    )

    student = relationship("Student", back_populates="study_plans")
    tasks = relationship(
        "StudyTask", back_populates="plan", cascade="all, delete-orphan"
    )


class StudyTask(Base):
    __tablename__ = "study_tasks"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("study_plans.id"), nullable=False, index=True
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    chapter: Mapped[str | None] = mapped_column(String, nullable=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    task_type: Mapped[str] = mapped_column(
        String, default="study", nullable=False
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer, default=30, nullable=False
    )
    priority_score: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    session_label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    plan = relationship("StudyPlan", back_populates="tasks")
