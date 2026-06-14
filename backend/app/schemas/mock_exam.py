from typing import Optional

from pydantic import BaseModel, Field


class QuestionOptionResponse(BaseModel):
    id: str
    label: str
    text: str
    display_order: int


class QuestionResponse(BaseModel):
    id: str
    board: str
    class_level: str
    stream: Optional[str] = None
    subject: str
    chapter: str
    unit: str
    question_number: str
    question_type: str
    text: str
    marks: int
    difficulty: str
    frequency_score: float
    importance_score: float
    priority_score: float
    source_year: Optional[int] = None
    options: list[QuestionOptionResponse] = Field(default_factory=list)


class QuestionListResponse(BaseModel):
    questions: list[QuestionResponse]


class SeedDemoQuestionsResponse(BaseModel):
    success: bool
    files_processed: int
    sources_created: int
    questions_created: int
    questions_updated: int


class MockAnswerSubmission(BaseModel):
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_index: Optional[int] = None
    answer_text: Optional[str] = None
    is_correct: Optional[bool] = None
    score_awarded: Optional[float] = Field(default=None, ge=0)
    time_spent_seconds: Optional[int] = Field(default=None, ge=0)


class CreateMockAttemptRequest(BaseModel):
    board: str = "CBSE"
    class_level: str = "12th"
    stream: Optional[str] = "science"
    subject: str
    chapter: Optional[str] = None
    unit: Optional[str] = None
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    answers: list[MockAnswerSubmission]


class MockAttemptAnswerResponse(BaseModel):
    id: str
    question_id: str
    selected_option_id: Optional[str] = None
    selected_option_index: Optional[int] = None
    answer_text: Optional[str] = None
    is_correct: Optional[bool] = None
    score_awarded: float
    max_score: float


class MockAttemptResponse(BaseModel):
    id: str
    student_id: str
    board: str
    class_level: str
    stream: Optional[str] = None
    subject: str
    chapter: Optional[str] = None
    unit: Optional[str] = None
    status: str
    total_questions: int
    attempted_count: int
    correct_count: int
    total_marks: float
    score_awarded: float
    score_percentage: float
    duration_seconds: Optional[int] = None
    submitted_at: Optional[str] = None
    answers: list[MockAttemptAnswerResponse] = Field(default_factory=list)


class MockAttemptListResponse(BaseModel):
    attempts: list[MockAttemptResponse]
