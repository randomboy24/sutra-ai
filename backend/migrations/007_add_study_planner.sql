-- Migration 007: Autonomous Study Planner Tables
-- Stores generated study plans and individual daily tasks
-- for the rule-based scheduling engine.

CREATE TABLE IF NOT EXISTS study_plans (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id),
    name VARCHAR NOT NULL,
    exam_dates TEXT NOT NULL DEFAULT '{}',
    daily_hours FLOAT NOT NULL DEFAULT 2.0,
    total_days INTEGER NOT NULL DEFAULT 30,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR NOT NULL DEFAULT 'active',
    metrics_snapshot TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS ix_study_plans_student_id ON study_plans (student_id);
CREATE INDEX IF NOT EXISTS ix_study_plans_status ON study_plans (status);

CREATE TABLE IF NOT EXISTS study_tasks (
    id VARCHAR(36) PRIMARY KEY,
    plan_id VARCHAR(36) NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    subject VARCHAR NOT NULL,
    chapter VARCHAR,
    unit VARCHAR,
    task_type VARCHAR NOT NULL DEFAULT 'study',
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    priority_score FLOAT NOT NULL DEFAULT 0.0,
    session_label VARCHAR NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_study_tasks_plan_id ON study_tasks (plan_id);
CREATE INDEX IF NOT EXISTS ix_study_tasks_date ON study_tasks (plan_id, scheduled_date);
CREATE INDEX IF NOT EXISTS ix_study_tasks_completed ON study_tasks (plan_id, completed);
