CREATE OR REPLACE FUNCTION update_issue_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status IS DISTINCT FROM 'resolved' THEN
        NEW.resolved_at := COALESCE(NEW.resolved_at, CURRENT_TIMESTAMP);
    ELSIF NEW.status <> 'resolved' THEN
        NEW.resolved_at := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_issue_resolved_at ON issue;

CREATE TRIGGER trg_update_issue_resolved_at
BEFORE UPDATE OF status ON issue
FOR EACH ROW
EXECUTE FUNCTION update_issue_resolved_at();
