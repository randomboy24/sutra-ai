from typing import Optional

from pydantic import BaseModel, Field


class SeedReadinessRequest(BaseModel):
    readiness_score: float = Field(default=74.0, ge=0, le=100)
    predicted_score: float = Field(default=68.5, ge=0, le=100)
    weak_chapters: list[str] = ["Electrostatics", "Organic Chemistry Basics"]
    strong_chapters: list[str] = ["Probability", "Calculus"]
    syllabus_coverage: float = Field(default=65.0, ge=0, le=100)
    confidence_level: str = "medium"


class ReadinessResponse(BaseModel):
    student_id: str
    clerk_user_id: str
    readiness_score: float
    predicted_score: float
    weak_chapters: list[str]
    strong_chapters: list[str]
    syllabus_coverage: float
    confidence_level: str
    mock_accuracy: float
    last_updated: Optional[str] = None


class SeedReadinessResponse(BaseModel):
    success: bool
    message: str
