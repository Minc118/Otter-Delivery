ALTER TABLE recommendation_feedback
    DROP CONSTRAINT IF EXISTS feedback_type_supported;

ALTER TABLE recommendation_feedback
    ADD CONSTRAINT feedback_type_supported CHECK (
        feedback_type IS NULL
        OR feedback_type IN (
            'like',
            'dislike',
            'clicked',
            'ordered',
            'skipped',
            'not_relevant',
            'other'
        )
    );
