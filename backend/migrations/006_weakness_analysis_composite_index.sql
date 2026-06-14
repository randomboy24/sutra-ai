-- Migration 006: Replace single-column student_id index with composite index
-- The original ix_weakness_analyses_student_id only indexes student_id,
-- but every query filters by student_id AND orders by generated_at DESC.
-- A composite index covering both columns eliminates the sort step.

DROP INDEX IF EXISTS ix_weakness_analyses_student_id;

CREATE INDEX IF NOT EXISTS ix_weakness_analyses_student_generated
    ON weakness_analyses (student_id, generated_at DESC);
