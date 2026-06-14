from typing import Optional

from pydantic import BaseModel, Field


class WeaknessItemResponse(BaseModel):
    category_type: str
    category_name: str
    subject: str
    total_questions: int
    incorrect_count: int
    error_rate: float
    avg_time_spent: Optional[float] = None
    severity: str
    frequency_score: float
    importance_score: float
    recommendation: Optional[str] = None


class WeaknessAnalysisResponse(BaseModel):
    id: str
    generated_at: str
    total_attempts_analyzed: int
    overall_accuracy: float
    overall_weakness_score: float
    total_questions_analyzed: int
    items: list[WeaknessItemResponse] = Field(default_factory=list)


class WeaknessTrendPoint(BaseModel):
    attempt_id: str
    subject: str
    chapter: Optional[str] = None
    score_percentage: float
    correct_count: int
    total_questions: int
    submitted_at: str


class WeaknessTrendResponse(BaseModel):
    trends: list[WeaknessTrendPoint] = Field(default_factory=list)
