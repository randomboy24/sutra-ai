CREATE TABLE IF NOT EXISTS academic_health (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE,
    health_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    trend VARCHAR(10) NOT NULL DEFAULT 'stable',
    study_hours_week DECIMAL(5,2) DEFAULT 0.00,
    revision_frequency INTEGER DEFAULT 0,
    engagement_streak INTEGER DEFAULT 0,
    mock_accuracy DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
