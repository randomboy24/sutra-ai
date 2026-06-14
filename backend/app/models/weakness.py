from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class WeaknessAnalysis(Base):
    __tablename__ = "weakness_analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    student_id: Mapped[str] = mapped_column(
        ForeignKey("students.id"), nullable=False, index=True
    )
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    total_attempts_analyzed: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    overall_accuracy: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    overall_weakness_score: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    total_questions_analyzed: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    student = relationship("Student", back_populates="weakness_analyses")
    items = relationship(
        "WeaknessItem", back_populates="analysis", cascade="all, delete-orphan"
    )


class WeaknessItem(Base):
    __tablename__ = "weakness_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    analysis_id: Mapped[str] = mapped_column(
        ForeignKey("weakness_analyses.id"), nullable=False, index=True
    )
    category_type: Mapped[str] = mapped_column(String, nullable=False)
    category_name: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    incorrect_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    avg_time_spent: Mapped[float | None] = mapped_column(Float, nullable=True)
    severity: Mapped[str] = mapped_column(String, default="medium", nullable=False)
    frequency_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)

    analysis = relationship("WeaknessAnalysis", back_populates="items")
