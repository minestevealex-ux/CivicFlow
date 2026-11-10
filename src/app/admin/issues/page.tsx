import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { pool } from "@/lib/db";

export const instant = false;

export default async function AdminIssuesPage() {
  await requireAdmin();

  const result = await pool.query(`
    SELECT
      i.issue_id,
      i.description,
      i.priority,
      i.status,
      i.reported_at,
      i.is_anonymous,
      c.name AS category,
      w.name AS ward,
      ci.name AS citizen_name
    FROM issue i
    JOIN category c ON c.category_id = i.category_id
    JOIN location l ON l.location_id = i.location_id
    JOIN ward w ON w.ward_id = l.ward_id
    LEFT JOIN citizen ci ON ci.citizen_id = i.citizen_id
    ORDER BY i.reported_at DESC
  `);

  const issues = result.rows;

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MUNICIPAL OPERATIONS</div>
          <h1>Reported issues</h1>
          <p className="page-subtitle">Review and manage citizen complaints.</p>
        </div>
        <Link className="date-label" href="/admin">Back to dashboard</Link>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>All reported issues</h2>
            <p>{issues.length} complaints in the system</p>
          </div>
          <span className="panel-tag">ALL ISSUES</span>
        </div>

        <div className="table-wrap">
          <table className="recent-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Category</th>
                <th>Reporter</th>
                <th>Ward</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reported</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.issue_id}>
                  <td>
                    <div className="issue-title">CF-{String(issue.issue_id).padStart(4, "0")}</div>
                    <div className="issue-description">{issue.description}</div>
                  </td>
                  <td>{issue.category}</td>
                  <td>{issue.is_anonymous ? "Anonymous" : issue.citizen_name}</td>
                  <td>{issue.ward}</td>
                  <td><span className={`priority-pill priority-${issue.priority}`}>{issue.priority}</span></td>
                  <td><span className={`status-pill status-${issue.status}`}>{issue.status.replaceAll("_", " ")}</span></td>
                  <td>{new Date(issue.reported_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <Link className="issue-open-link" href={`/admin/issues/${issue.issue_id}`}>
                      View details →
                    </Link>
                  </td>
                </tr>
              ))}
              {issues.length === 0 && <tr><td colSpan={8}>No issues found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
