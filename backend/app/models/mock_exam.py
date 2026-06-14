from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuestionSource(Base):
    __tablename__ = "question_sources"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    board: Mapped[str] = mapped_column(String, nullable=False, index=True)
    class_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    stream: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    source_file: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", back_populates="source")


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    source_id: Mapped[str] = mapped_column(
        ForeignKey("question_sources.id"), nullable=False, index=True
    )
    board: Mapped[str] = mapped_column(String, nullable=False, index=True)
    class_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    stream: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String, nullable=False, index=True)
    chapter: Mapped[str] = mapped_column(String, nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String, nullable=False, index=True)
    question_number: Mapped[str] = mapped_column(String, nullable=False)
    question_type: Mapped[str] = mapped_column(
        String, default="theory", nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    expected_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    marks: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, default="Medium", nullable=False)
    frequency_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    importance_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    source_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    source = relationship("QuestionSource", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question")
    attempt_answers = relationship("MockAttemptAnswer", back_populates="question")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    question_id: Mapped[str] = mapped_column(
        ForeignKey("questions.id"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    question = relationship("Question", back_populates="options")
    attempt_answers = relationship("MockAttemptAnswer", back_populates="selected_option")


class MockAttempt(Base):
    __tablename__ = "mock_attempts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    student_id: Mapped[str] = mapped_column(
        ForeignKey("students.id"), nullable=False, index=True
    )
    board: Mapped[str] = mapped_column(String, nullable=False, index=True)
    class_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    stream: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    subject: Mapped[str] = mapped_column(String, nullable=False, index=True)
    chapter: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String, default="submitted", nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attempted_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_marks: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    score_awarded: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    score_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=True
    )

    student = relationship("Student", back_populates="mock_attempts")
    answers = relationship("MockAttemptAnswer", back_populates="attempt")


class MockAttemptAnswer(Base):
    __tablename__ = "mock_attempt_answers"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    attempt_id: Mapped[str] = mapped_column(
        ForeignKey("mock_attempts.id"), nullable=False, index=True
    )
    question_id: Mapped[str] = mapped_column(
        ForeignKey("questions.id"), nullable=False, index=True
    )
    selected_option_id: Mapped[str | None] = mapped_column(
        ForeignKey("question_options.id"), nullable=True
    )
    selected_option_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    score_awarded: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    attempt = relationship("MockAttempt", back_populates="answers")
    question = relationship("Question", back_populates="attempt_answers")
    selected_option = relationship("QuestionOption", back_populates="attempt_answers")
