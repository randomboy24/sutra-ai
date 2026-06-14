from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.verify import get_current_user
from app.database import SessionLocal
from app.models.mock_exam import (
    MockAttempt,
    MockAttemptAnswer,
    Question,
    QuestionOption,
)
from app.models.student import Student
from app.models.user import User
from app.schemas.mock_exam import (
    CreateMockAttemptRequest,
    MockAttemptAnswerResponse,
    MockAttemptListResponse,
    MockAttemptResponse,
    QuestionListResponse,
    QuestionOptionResponse,
    QuestionResponse,
    SeedDemoQuestionsResponse,
)
from app.services.demo_pyq_seed import seed_demo_pyq_data


router = APIRouter(prefix="/api/mock-exams", tags=["mock-exams"])


@router.post("/seed-demo", response_model=SeedDemoQuestionsResponse)
def seed_demo_questions(
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        _get_current_student(db, verified_user_id)
        result = seed_demo_pyq_data(db)
        return SeedDemoQuestionsResponse(success=True, **result)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while seeding mock questions",
        )
    finally:
        db.close()


@router.get("/questions", response_model=QuestionListResponse)
def list_questions(
    board: str = "CBSE",
    class_level: str = "12th",
    stream: str | None = "science",
    subject: str | None = Query(default=None),
    chapter: str | None = Query(default=None),
    unit: str | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=50),
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        _get_current_student(db, verified_user_id)

        query = db.query(Question).filter(
            Question.board == board,
            Question.class_level == class_level,
            Question.is_active.is_(True),
        )

        if stream:
            query = query.filter(Question.stream == stream)
        if subject:
            query = query.filter(Question.subject == subject)
        if chapter:
            query = query.filter(Question.chapter == chapter)
        if unit:
            query = query.filter(Question.unit == unit)

        questions = sorted(
            query.all(),
            key=lambda question: _priority_score(question),
            reverse=True,
        )[:limit]

        return QuestionListResponse(
            questions=[_question_response(question) for question in questions]
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching mock questions",
        )
    finally:
        db.close()


@router.post("/attempts", response_model=MockAttemptResponse)
def create_attempt(
    body: CreateMockAttemptRequest,
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        if not body.answers:
            raise HTTPException(
                status_code=400, detail="At least one answer is required"
            )

        question_ids = [answer.question_id for answer in body.answers]
        questions = (
            db.query(Question)
            .filter(Question.id.in_(question_ids), Question.is_active.is_(True))
            .all()
        )
        question_by_id = {question.id: question for question in questions}

        missing_ids = sorted(set(question_ids) - set(question_by_id))
        if missing_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown question ids: {', '.join(missing_ids)}",
            )

        attempt_answers: list[MockAttemptAnswer] = []
        attempted_count = 0
        correct_count = 0
        total_marks = 0.0
        score_awarded = 0.0

        attempt = MockAttempt(
            student_id=student.id,
            board=body.board,
            class_level=body.class_level,
            stream=body.stream,
            subject=body.subject,
            chapter=body.chapter,
            unit=body.unit,
            duration_seconds=body.duration_seconds,
            total_questions=len(body.answers),
        )
        db.add(attempt)
        db.flush()

        for submitted in body.answers:
            question = question_by_id[submitted.question_id]
            selected_option = _resolve_selected_option(db, question, submitted)
            is_correct = _resolve_correctness(selected_option, submitted)
            max_score = float(question.marks)
            awarded = _resolve_score(max_score, is_correct, submitted.score_awarded)
            answered = bool(
                submitted.answer_text
                or submitted.selected_option_id
                or submitted.selected_option_index is not None
                or submitted.score_awarded is not None
                or submitted.is_correct is not None
            )

            total_marks += max_score
            score_awarded += awarded
            if answered:
                attempted_count += 1
            if is_correct:
                correct_count += 1

            attempt_answer = MockAttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id if selected_option else None,
                selected_option_index=submitted.selected_option_index,
                answer_text=submitted.answer_text,
                is_correct=is_correct,
                score_awarded=awarded,
                max_score=max_score,
                time_spent_seconds=submitted.time_spent_seconds,
            )
            db.add(attempt_answer)
            attempt_answers.append(attempt_answer)

        attempt.attempted_count = attempted_count
        attempt.correct_count = correct_count
        attempt.total_marks = total_marks
        attempt.score_awarded = score_awarded
        attempt.score_percentage = (
            round((score_awarded / total_marks) * 100, 2) if total_marks else 0.0
        )

        db.commit()
        db.refresh(attempt)
        for answer in attempt_answers:
            db.refresh(answer)

        return _attempt_response(attempt, attempt_answers)
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while saving mock attempt",
        )
    finally:
        db.close()


@router.get("/attempts", response_model=MockAttemptListResponse)
def list_attempts(
    subject: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        query = db.query(MockAttempt).filter(MockAttempt.student_id == student.id)
        if subject:
            query = query.filter(MockAttempt.subject == subject)

        attempts = query.order_by(MockAttempt.submitted_at.desc()).limit(limit).all()

        return MockAttemptListResponse(
            attempts=[
                _attempt_response(attempt, attempt.answers) for attempt in attempts
            ]
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching mock attempts",
        )
    finally:
        db.close()


@router.get("/attempts/{attempt_id}", response_model=MockAttemptResponse)
def get_attempt(
    attempt_id: str,
    verified_user_id: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        student = _get_current_student(db, verified_user_id)
        attempt = (
            db.query(MockAttempt)
            .filter(MockAttempt.id == attempt_id, MockAttempt.student_id == student.id)
            .first()
        )

        if not attempt:
            raise HTTPException(status_code=404, detail="Mock attempt not found")

        return _attempt_response(attempt, attempt.answers)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while fetching mock attempt",
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


def _priority_score(question: Question) -> float:
    return round(question.frequency_score * 0.6 + question.importance_score * 0.4, 2)


def _question_response(question: Question) -> QuestionResponse:
    return QuestionResponse(
        id=question.id,
        board=question.board,
        class_level=question.class_level,
        stream=question.stream,
        subject=question.subject,
        chapter=question.chapter,
        unit=question.unit,
        question_number=question.question_number,
        question_type=question.question_type,
        text=question.text,
        expected_answer=question.expected_answer,
        marks=question.marks,
        difficulty=question.difficulty,
        frequency_score=question.frequency_score,
        importance_score=question.importance_score,
        priority_score=_priority_score(question),
        source_year=question.source_year,
        options=[
            QuestionOptionResponse(
                id=option.id,
                label=option.label,
                text=option.text,
                is_correct=option.is_correct,
                display_order=option.display_order,
            )
            for option in sorted(
                question.options, key=lambda option: option.display_order
            )
        ],
    )


def _resolve_selected_option(
    db, question: Question, submitted
) -> QuestionOption | None:
    if submitted.selected_option_id:
        option = (
            db.query(QuestionOption)
            .filter(
                QuestionOption.id == submitted.selected_option_id,
                QuestionOption.question_id == question.id,
            )
            .first()
        )
        if not option:
            raise HTTPException(status_code=400, detail="Invalid selected option")
        return option

    if submitted.selected_option_index is not None:
        return (
            db.query(QuestionOption)
            .filter(
                QuestionOption.question_id == question.id,
                QuestionOption.display_order == submitted.selected_option_index,
            )
            .first()
        )

    return None


def _resolve_correctness(
    selected_option: QuestionOption | None,
    submitted,
) -> bool | None:
    if selected_option:
        return selected_option.is_correct
    return submitted.is_correct


def _resolve_score(
    max_score: float,
    is_correct: bool | None,
    submitted_score: float | None,
) -> float:
    if submitted_score is not None:
        return min(submitted_score, max_score)
    if is_correct is True:
        return max_score
    return 0.0


def _attempt_response(
    attempt: MockAttempt,
    answers: list[MockAttemptAnswer],
) -> MockAttemptResponse:
    return MockAttemptResponse(
        id=attempt.id,
        student_id=attempt.student_id,
        board=attempt.board,
        class_level=attempt.class_level,
        stream=attempt.stream,
        subject=attempt.subject,
        chapter=attempt.chapter,
        unit=attempt.unit,
        status=attempt.status,
        total_questions=attempt.total_questions,
        attempted_count=attempt.attempted_count,
        correct_count=attempt.correct_count,
        total_marks=attempt.total_marks,
        score_awarded=attempt.score_awarded,
        score_percentage=attempt.score_percentage,
        duration_seconds=attempt.duration_seconds,
        submitted_at=attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        answers=[
            MockAttemptAnswerResponse(
                id=answer.id,
                question_id=answer.question_id,
                selected_option_id=answer.selected_option_id,
                selected_option_index=answer.selected_option_index,
                answer_text=answer.answer_text,
                is_correct=answer.is_correct,
                score_awarded=answer.score_awarded,
                max_score=answer.max_score,
            )
            for answer in answers
        ],
    )
