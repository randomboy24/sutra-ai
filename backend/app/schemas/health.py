from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SeedHealthRequest(BaseModel):
    health_score: float = 82.5
    trend: str = "up"
    study_hours_week: float = 12.5
    revision_frequency: int = 8
    engagement_streak: int = 5


class HealthResponse(BaseModel):
    student_id: str
    clerk_user_id: str
    health_score: float
    trend: str
    study_hours_week: float
    revision_frequency: int
    engagement_streak: int
    mock_accuracy: float
    last_updated: Optional[str] = None


class SeedHealthResponse(BaseModel):
    success: bool
    message: str
