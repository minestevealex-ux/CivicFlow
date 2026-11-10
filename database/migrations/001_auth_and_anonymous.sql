ALTER TABLE citizen
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE citizen
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'citizen';

ALTER TABLE issue
ALTER COLUMN citizen_id DROP NOT NULL;

ALTER TABLE issue
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_citizen_role'
    ) THEN
        ALTER TABLE citizen
        ADD CONSTRAINT chk_citizen_role
        CHECK (role IN ('citizen', 'admin'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_issue_reporter'
    ) THEN
        ALTER TABLE issue
        ADD CONSTRAINT chk_issue_reporter
        CHECK (
            (is_anonymous = TRUE AND citizen_id IS NULL)
            OR
            (is_anonymous = FALSE AND citizen_id IS NOT NULL)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_issue_reported_at
ON issue(reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_citizen_role
ON citizen(role);
