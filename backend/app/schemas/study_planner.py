from typing import Optional

from pydantic import BaseModel, Field


class StudyTaskResponse(BaseModel):
    id: str
    scheduled_date: str
    day_number: int
    subject: str
    chapter: Optional[str] = None
    unit: Optional[str] = None
    task_type: str
    duration_minutes: int
    priority_score: float
    session_label: str
    description: Optional[str] = None
    completed: bool
    completed_at: Optional[str] = None


class StudyPlanResponse(BaseModel):
    id: str
    name: str
    exam_dates: dict[str, str] = Field(default_factory=dict)
    daily_hours: float
    total_days: int
    generated_at: str
    status: str
    metrics_snapshot: dict = Field(default_factory=dict)
    tasks: list[StudyTaskResponse] = Field(default_factory=list)


class StudyPlanSummary(BaseModel):
    id: str
    name: str
    total_days: int
    generated_at: str
    status: str
    tasks_completed: int
    tasks_total: int


class GeneratePlanRequest(BaseModel):
    exam_dates: dict[str, str] = Field(default_factory=dict)
    daily_hours: float = Field(default=2.0, ge=1.0, le=12.0)
    subject_focus: Optional[list[str]] = None
