from uuid import uuid4
from datetime import datetime

from sqlalchemy import String, ForeignKey, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExamReadiness(Base):
    __tablename__ = "exam_readiness"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid4())
    )

    student_id: Mapped[str] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
        unique=True,
        index=True
    )

    readiness_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False
    )

    predicted_score: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    weak_chapters: Mapped[str] = mapped_column(
        Text,
        default="[]"
    )

    strong_chapters: Mapped[str] = mapped_column(
        Text,
        default="[]"
    )

    syllabus_coverage: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    confidence_level: Mapped[str] = mapped_column(
        String(10),
        default="medium"
    )

    mock_accuracy: Mapped[float] = mapped_column(
        Float,
        default=0.0
    )

    last_updated: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    student = relationship(
        "Student",
        back_populates="exam_readiness"
    )
