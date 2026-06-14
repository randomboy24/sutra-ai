CREATE TABLE IF NOT EXISTS question_sources (
    id VARCHAR(36) PRIMARY KEY,
    board VARCHAR NOT NULL,
    class_level VARCHAR NOT NULL,
    stream VARCHAR,
    subject VARCHAR NOT NULL,
    source_type VARCHAR NOT NULL,
    source_name VARCHAR NOT NULL UNIQUE,
    source_file VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_question_sources_board ON question_sources (board);
CREATE INDEX IF NOT EXISTS ix_question_sources_class_level ON question_sources (class_level);
CREATE INDEX IF NOT EXISTS ix_question_sources_stream ON question_sources (stream);
CREATE INDEX IF NOT EXISTS ix_question_sources_subject ON question_sources (subject);

CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    source_id VARCHAR(36) NOT NULL REFERENCES question_sources(id),
    board VARCHAR NOT NULL,
    class_level VARCHAR NOT NULL,
    stream VARCHAR,
    subject VARCHAR NOT NULL,
    chapter VARCHAR NOT NULL,
    unit VARCHAR NOT NULL,
    question_number VARCHAR NOT NULL,
    question_type VARCHAR NOT NULL DEFAULT 'theory',
    text TEXT NOT NULL,
    expected_answer TEXT,
    marks INTEGER NOT NULL DEFAULT 1,
    difficulty VARCHAR NOT NULL DEFAULT 'Medium',
    frequency_score FLOAT NOT NULL DEFAULT 0,
    importance_score FLOAT NOT NULL DEFAULT 0,
    source_year INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_questions_source_id ON questions (source_id);
CREATE INDEX IF NOT EXISTS ix_questions_board ON questions (board);
CREATE INDEX IF NOT EXISTS ix_questions_class_level ON questions (class_level);
CREATE INDEX IF NOT EXISTS ix_questions_stream ON questions (stream);
CREATE INDEX IF NOT EXISTS ix_questions_subject ON questions (subject);
CREATE INDEX IF NOT EXISTS ix_questions_chapter ON questions (chapter);
CREATE INDEX IF NOT EXISTS ix_questions_unit ON questions (unit);

CREATE TABLE IF NOT EXISTS question_options (
    id VARCHAR(36) PRIMARY KEY,
    question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
    label VARCHAR NOT NULL,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_question_options_question_id ON question_options (question_id);

CREATE TABLE IF NOT EXISTS mock_attempts (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL REFERENCES students(id),
    board VARCHAR NOT NULL,
    class_level VARCHAR NOT NULL,
    stream VARCHAR,
    subject VARCHAR NOT NULL,
    chapter VARCHAR,
    unit VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'submitted',
    total_questions INTEGER NOT NULL DEFAULT 0,
    attempted_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_marks FLOAT NOT NULL DEFAULT 0,
    score_awarded FLOAT NOT NULL DEFAULT 0,
    score_percentage FLOAT NOT NULL DEFAULT 0,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_mock_attempts_student_id ON mock_attempts (student_id);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_board ON mock_attempts (board);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_class_level ON mock_attempts (class_level);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_stream ON mock_attempts (stream);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_subject ON mock_attempts (subject);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_chapter ON mock_attempts (chapter);
CREATE INDEX IF NOT EXISTS ix_mock_attempts_unit ON mock_attempts (unit);

CREATE TABLE IF NOT EXISTS mock_attempt_answers (
    id VARCHAR(36) PRIMARY KEY,
    attempt_id VARCHAR(36) NOT NULL REFERENCES mock_attempts(id),
    question_id VARCHAR(36) NOT NULL REFERENCES questions(id),
    selected_option_id VARCHAR(36) REFERENCES question_options(id),
    selected_option_index INTEGER,
    answer_text TEXT,
    is_correct BOOLEAN,
    score_awarded FLOAT NOT NULL DEFAULT 0,
    max_score FLOAT NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS ix_mock_attempt_answers_attempt_id ON mock_attempt_answers (attempt_id);
CREATE INDEX IF NOT EXISTS ix_mock_attempt_answers_question_id ON mock_attempt_answers (question_id);
