ALTER TABLE mock_attempt_answers
  DROP CONSTRAINT mock_attempt_answers_selected_option_id_fkey,
  ADD CONSTRAINT mock_attempt_answers_selected_option_id_fkey
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id)
    ON DELETE SET NULL;
