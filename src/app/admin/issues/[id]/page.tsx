import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { pool } from "@/lib/db";
import IssueControls from "./issue-controls";

export const instant = false;

export default async function IssueDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const issueId = Number(id);

  if (!Number.isInteger(issueId) || issueId < 1) notFound();

  const result = await pool.query(`
    SELECT
      i.issue_id,
      i.description,
      i.priority,
      i.status,
      i.reported_at,
      i.resolved_at,
      i.is_anonymous,
      c.name AS category,
      c.description AS category_description,
      ci.name AS citizen_name,
      ci.email AS citizen_email,
      ci.phone AS citizen_phone,
      l.address,
      l.latitude,
      l.longitude,
      w.name AS ward,
      w.zone
    FROM issue i
    JOIN category c ON c.category_id = i.category_id
    JOIN location l ON l.location_id = i.location_id
    JOIN ward w ON w.ward_id = l.ward_id
    LEFT JOIN citizen ci ON ci.citizen_id = i.citizen_id
    WHERE i.issue_id = $1
  `, [issueId]);

  if (!result.rows.length) notFound();

  const issue = result.rows[0];

  const assignments = await pool.query(`
    SELECT
      a.assignment_id,
      a.assigned_at,
      a.completed_at,
      a.status,
      worker.name AS worker_name,
      worker.email AS worker_email,
      d.name AS department
    FROM assignment a
    JOIN worker ON worker.worker_id = a.worker_id
    JOIN department d ON d.department_id = worker.department_id
    WHERE a.issue_id = $1
    ORDER BY a.assigned_at DESC
  `, [issueId]);

  const workers = await pool.query(`
    SELECT worker.worker_id, worker.name, d.name AS department
    FROM worker
    JOIN department d ON d.department_id = worker.department_id
    WHERE worker.availability_status = 'available'
    ORDER BY d.name, worker.name
  `);

  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ISSUE MANAGEMENT / CF-{String(issue.issue_id).padStart(4, "0")}</div>
          <h1>Issue details</h1>
          <p className="page-subtitle">Full complaint information and municipal activity.</p>
        </div>
        <Link className="date-label" href="/admin/issues">← All issues</Link>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-heading">
          <div>
            <h2>CF-{String(issue.issue_id).padStart(4, "0")} · {issue.category}</h2>
            <p>Reported {new Date(issue.reported_at).toLocaleString("en-IN")}</p>
          </div>
          <span className={`priority-pill priority-${issue.priority}`}>{issue.priority}</span>
        </div>

        <h2 style={{ fontSize: 17, marginBottom: 10 }}>Complaint description</h2>
        <p style={{ color: "#56657a", lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: 13 }}>
          {issue.description}
        </p>

        <div className="detail-grid">
          <div><span>Current status</span><strong>{issue.status.replaceAll("_", " ")}</strong></div>
          <div><span>Category</span><strong>{issue.category}</strong></div>
          <div><span>Priority</span><strong>{issue.priority}</strong></div>
          <div><span>Ward</span><strong>{issue.ward}</strong></div>
          <div><span>Zone</span><strong>{issue.zone}</strong></div>
          <div><span>Resolved at</span><strong>{issue.resolved_at ? new Date(issue.resolved_at).toLocaleString("en-IN") : "Not resolved"}</strong></div>
        </div>
      </section>

      <div className="lower-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Reporter information</h2><p>Citizen account details</p></div>
          </div>
          <div className="detail-grid single">
            <div><span>Reporter type</span><strong>{issue.is_anonymous ? "Anonymous submission" : "Registered citizen"}</strong></div>
            <div><span>Name</span><strong>{issue.is_anonymous ? "Not provided" : issue.citizen_name}</strong></div>
            <div><span>Email</span><strong>{issue.is_anonymous ? "Not provided" : issue.citizen_email}</strong></div>
            <div><span>Phone</span><strong>{issue.is_anonymous ? "Not provided" : issue.citizen_phone || "Not provided"}</strong></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Location information</h2><p>Reported incident location</p></div>
          </div>
          <div className="detail-grid single">
            <div><span>Address</span><strong>{issue.address}</strong></div>
            <div><span>Latitude</span><strong>{issue.latitude ?? "Not provided"}</strong></div>
            <div><span>Longitude</span><strong>{issue.longitude ?? "Not provided"}</strong></div>
          </div>
          {issue.latitude !== null && issue.longitude !== null && (
            <a className="issue-open-link" target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}>
              Open coordinates in Google Maps →
            </a>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div><h2>Assignments</h2><p>Worker allocation and history</p></div>
        </div>
        {assignments.rows.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Worker</th><th>Department</th><th>Assigned</th><th>Completed</th><th>Status</th></tr></thead>
              <tbody>
                {assignments.rows.map((a) => (
                  <tr key={a.assignment_id}>
                    <td>{a.worker_name}</td>
                    <td>{a.department}</td>
                    <td>{new Date(a.assigned_at).toLocaleString("en-IN")}</td>
                    <td>{a.completed_at ? new Date(a.completed_at).toLocaleString("en-IN") : "—"}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="page-subtitle">No workers have been assigned to this issue yet.</p>}
      </section>

      <IssueControls issueId={issueId} currentStatus={issue.status} currentPriority={issue.priority} workers={workers.rows} />
    </main>
  );
}
