from uuid import uuid4
from datetime import datetime

from sqlalchemy import String, ForeignKey, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AcademicHealth(Base):
    __tablename__ = "academic_health"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )

    student_id: Mapped[str] = mapped_column(
        ForeignKey("students.id"), nullable=False, unique=True, index=True
    )

    health_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    trend: Mapped[str] = mapped_column(String(10), default="stable", nullable=False)

    study_hours_week: Mapped[float] = mapped_column(Float, default=0.0)

    revision_frequency: Mapped[int] = mapped_column(default=0)

    engagement_streak: Mapped[int] = mapped_column(default=0)

    mock_accuracy: Mapped[float] = mapped_column(Float, default=0.0)

    last_updated: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="academic_health")
