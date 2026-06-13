from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SeedHealthRequest(BaseModel):
    health_score: float = Field(default=82.5, ge=0, le=100)
    trend: Literal["up", "down", "stable"] = "up"
    study_hours_week: float = Field(default=12.5, ge=0)
    revision_frequency: int = Field(default=8, ge=0)
    engagement_streak: int = Field(default=5, ge=0)


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
