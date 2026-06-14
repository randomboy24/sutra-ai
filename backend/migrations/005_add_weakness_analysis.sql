-- Migration 005: Weakness Analysis Tables
-- Stores per-student weakness analysis results and individual weakness items
-- across multiple dimensions: chapter, unit, difficulty, question type, etc.

CREATE TABLE IF NOT EXISTS weakness_analyses (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id),
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_attempts_analyzed INTEGER NOT NULL DEFAULT 0,
    overall_accuracy FLOAT NOT NULL DEFAULT 0,
    overall_weakness_score FLOAT NOT NULL DEFAULT 0,
    total_questions_analyzed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_weakness_analyses_student_id ON weakness_analyses (student_id);

CREATE TABLE IF NOT EXISTS weakness_items (
    id VARCHAR(36) PRIMARY KEY,
    analysis_id VARCHAR(36) NOT NULL REFERENCES weakness_analyses(id),
    category_type VARCHAR NOT NULL,
    category_name VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 0,
    incorrect_count INTEGER NOT NULL DEFAULT 0,
    error_rate FLOAT NOT NULL DEFAULT 0,
    avg_time_spent FLOAT,
    severity VARCHAR NOT NULL DEFAULT 'medium',
    frequency_score FLOAT DEFAULT 0,
    importance_score FLOAT DEFAULT 0,
    recommendation TEXT
);

CREATE INDEX IF NOT EXISTS ix_weakness_items_analysis_id ON weakness_items (analysis_id);
CREATE INDEX IF NOT EXISTS ix_weakness_items_category ON weakness_items (category_type, category_name);
CREATE INDEX IF NOT EXISTS ix_weakness_items_severity ON weakness_items (severity);
