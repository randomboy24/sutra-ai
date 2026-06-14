from uuid import uuid4

from sqlalchemy import String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True
    )

    full_name: Mapped[str] = mapped_column(String, nullable=False)

    is_individual: Mapped[bool] = mapped_column(Boolean, default=True)

    institute_id: Mapped[str | None] = mapped_column(String, nullable=True)

    class_level: Mapped[str | None] = mapped_column(String, nullable=True)

    board: Mapped[str | None] = mapped_column(String, nullable=True)

    stream: Mapped[str | None] = mapped_column(String, nullable=True)

    science_group: Mapped[str | None] = mapped_column(String, nullable=True)

    onboarding_complete: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    user = relationship("User", back_populates="student")

    academic_health = relationship(
        "AcademicHealth", back_populates="student", uselist=False
    )

    exam_readiness = relationship(
        "ExamReadiness", back_populates="student", uselist=False
    )

    mock_attempts = relationship("MockAttempt", back_populates="student")
