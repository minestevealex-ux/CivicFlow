SELECT
    status,
    COUNT(*) AS total_issues
FROM issue
GROUP BY status
ORDER BY total_issues DESC;

SELECT
    w.name AS ward,
    COUNT(i.issue_id) AS total_issues
FROM ward w
JOIN location l ON w.ward_id = l.ward_id
LEFT JOIN issue i ON l.location_id = i.location_id
GROUP BY w.ward_id, w.name
ORDER BY total_issues DESC;

SELECT
    d.name AS department,
    COUNT(DISTINCT a.issue_id) AS assigned_issues,
    COUNT(a.assignment_id) AS total_assignments
FROM department d
JOIN worker w ON d.department_id = w.department_id
LEFT JOIN assignment a ON w.worker_id = a.worker_id
GROUP BY d.department_id, d.name
ORDER BY assigned_issues DESC;

SELECT
    i.issue_id,
    c.name AS category,
    i.description,
    i.priority,
    i.status,
    l.address AS location
FROM issue i
JOIN category c ON i.category_id = c.category_id
JOIN location l ON i.location_id = l.location_id
WHERE i.priority = 'critical'
AND i.status NOT IN ('resolved', 'rejected')
ORDER BY i.reported_at DESC;

SELECT
    c.name,
    c.email,
    COUNT(i.issue_id) AS reported_issues
FROM citizen c
JOIN issue i ON c.citizen_id = i.citizen_id
GROUP BY c.citizen_id, c.name, c.email
HAVING COUNT(i.issue_id) > 1
ORDER BY reported_issues DESC;

SELECT
    w.name AS worker,
    d.name AS department,
    COUNT(a.assignment_id) AS total_assignments
FROM worker w
JOIN department d ON w.department_id = d.department_id
LEFT JOIN assignment a ON w.worker_id = a.worker_id
GROUP BY w.worker_id, w.name, d.name
ORDER BY total_assignments DESC;


-- CTE: Rank wards by unresolved civic issues
WITH ward_issue_counts AS (
    SELECT
        w.ward_id,
        w.name AS ward_name,
        COUNT(i.issue_id) AS unresolved_count
    FROM ward w
    LEFT JOIN location l ON w.ward_id = l.ward_id
    LEFT JOIN issue i
        ON l.location_id = i.location_id
        AND i.status NOT IN ('resolved', 'rejected')
    GROUP BY w.ward_id, w.name
)
SELECT
    ward_name,
    unresolved_count,
    RANK() OVER (ORDER BY unresolved_count DESC) AS ward_rank
FROM ward_issue_counts
ORDER BY ward_rank, ward_name;
