CREATE TABLE IF NOT EXISTS exam_readiness (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE,
    readiness_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    predicted_score DECIMAL(5,2) DEFAULT 0.00,
    weak_chapters TEXT DEFAULT '[]',
    strong_chapters TEXT DEFAULT '[]',
    syllabus_coverage DECIMAL(5,2) DEFAULT 0.00,
    confidence_level VARCHAR(10) DEFAULT 'medium',
    mock_accuracy DECIMAL(5,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
