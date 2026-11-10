import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const instant = false;

type Summary = {
  total: string;
  resolved: string;
  pending: string;
  active: string;
  critical: string;
};

type StatusRow = {
  status: string;
  count: string;
};

type PriorityRow = {
  priority: string;
  count: string;
};

type DepartmentRow = {
  name: string;
  workers: string;
  active_assignments: string;
  completed_assignments: string;
};

type WardRow = {
  name: string;
  issue_count: string;
};

type IssueRow = {
  issue_id: number;
  description: string;
  priority: string;
  status: string;
  reported_at: Date;
  category: string;
  ward: string;
};

function number(value: string | number) {
  return Number(value || 0);
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status: string) {
  const classes: Record<string, string> = {
    submitted: "status-submitted",
    under_review: "status-review",
    assigned: "status-assigned",
    in_progress: "status-progress",
    resolved: "status-resolved",
    rejected: "status-rejected",
  };
  return classes[status] || "status-default";
}

function priorityClass(priority: string) {
  const classes: Record<string, string> = {
    critical: "priority-critical",
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  };
  return classes[priority] || "priority-medium";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function Home() {
  await requireAdmin();
  let summary: Summary = {
    total: "0",
    resolved: "0",
    pending: "0",
    active: "0",
    critical: "0",
  };
  let statuses: StatusRow[] = [];
  let priorities: PriorityRow[] = [];
  let departments: DepartmentRow[] = [];
  let wards: WardRow[] = [];
  let recentIssues: IssueRow[] = [];
  let databaseError = false;

  try {
    const [summaryResult, statusResult, priorityResult, departmentResult, wardResult, issueResult] =
      await Promise.all([
        pool.query(`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
            COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) AS pending,
            COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress')) AS active,
            COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved', 'rejected')) AS critical
          FROM issue
        `),
        pool.query(`
          SELECT status, COUNT(*) AS count
          FROM issue
          GROUP BY status
          ORDER BY count DESC
        `),
        pool.query(`
          SELECT priority, COUNT(*) AS count
          FROM issue
          GROUP BY priority
          ORDER BY
            CASE priority
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'medium' THEN 3
              WHEN 'low' THEN 4
            END
        `),
        pool.query(`
          SELECT
            d.name,
            COUNT(DISTINCT w.worker_id) AS workers,
            COUNT(a.assignment_id) FILTER (
              WHERE a.status IN ('pending', 'in_progress')
            ) AS active_assignments,
            COUNT(a.assignment_id) FILTER (
              WHERE a.status = 'completed'
            ) AS completed_assignments
          FROM department d
          LEFT JOIN worker w ON w.department_id = d.department_id
          LEFT JOIN assignment a ON a.worker_id = w.worker_id
          GROUP BY d.department_id, d.name
          ORDER BY active_assignments DESC, d.name
        `),
        pool.query(`
          SELECT w.name, COUNT(i.issue_id) AS issue_count
          FROM ward w
          LEFT JOIN location l ON l.ward_id = w.ward_id
          LEFT JOIN issue i ON i.location_id = l.location_id
          GROUP BY w.ward_id, w.name
          ORDER BY issue_count DESC, w.name
        `),
        pool.query(`
          SELECT
            i.issue_id,
            i.description,
            i.priority,
            i.status,
            i.reported_at,
            c.name AS category,
            w.name AS ward
          FROM issue i
          JOIN category c ON c.category_id = i.category_id
          JOIN location l ON l.location_id = i.location_id
          JOIN ward w ON w.ward_id = l.ward_id
          ORDER BY i.reported_at DESC
          LIMIT 7
        `),
      ]);

    summary = summaryResult.rows[0] as Summary;
    statuses = statusResult.rows as StatusRow[];
    priorities = priorityResult.rows as PriorityRow[];
    departments = departmentResult.rows as DepartmentRow[];
    wards = wardResult.rows as WardRow[];
    recentIssues = issueResult.rows as IssueRow[];
  } catch (error) {
    console.error("Dashboard failed to load:", error);
    databaseError = true;
  }

  const total = number(summary.total);
  const resolved = number(summary.resolved);
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  const maxStatus = Math.max(1, ...statuses.map((item) => number(item.count)));
  const maxPriority = Math.max(1, ...priorities.map((item) => number(item.count)));
  const maxWard = Math.max(1, ...wards.map((item) => number(item.issue_count)));

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <a className="brand" href="/admin">
          <span className="brand-mark">C</span>
          <span>Civic<span className="brand-light">Flow</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="sidebar-nav">
          <a className="nav-link active" href="/admin">
            <span className="nav-icon">▦</span> Overview
          </a>
          <a className="nav-link" href="/admin/issues">
            <span className="nav-icon">◷</span> Reported issues
          </a>
          <a className="nav-link" href="/admin#departments">
            <span className="nav-icon">⌂</span> Departments
          </a>
          <a className="nav-link" href="/admin#wards">
            <span className="nav-icon">⌖</span> Ward analytics
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-label">SYSTEM</div>
          <div className="system-status">
            <span className="live-dot" />
            Database connected
          </div>
          <div className="sidebar-version">CivicFlow · Project v1.0</div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="topbar-right">
            <span className="live-indicator"><span className="live-dot" /> Live database</span>
            <div className="avatar">A</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">MUNICIPAL OPERATIONS</div>
              <h1>Dashboard overview</h1>
              <p className="page-subtitle">Monitor civic issues, municipal resources and resolution progress.</p>
            </div>
            <div className="date-label">
              <span>◷</span> {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          {databaseError && (
            <div className="error-banner">
              Unable to retrieve dashboard data. Check that PostgreSQL is running.
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top"><span>Total issues</span><span className="stat-icon blue">▤</span></div>
              <div className="stat-value">{number(summary.total)}</div>
              <div className="stat-foot">All reported civic complaints</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Awaiting review</span><span className="stat-icon amber">◷</span></div>
              <div className="stat-value">{number(summary.pending)}</div>
              <div className="stat-foot">Submitted or under review</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>In progress</span><span className="stat-icon violet">↗</span></div>
              <div className="stat-value">{number(summary.active)}</div>
              <div className="stat-foot">Assigned or being resolved</div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Resolved issues</span><span className="stat-icon green">✓</span></div>
              <div className="stat-value">{number(summary.resolved)}</div>
              <div className="stat-foot">{resolutionRate}% overall resolution rate</div>
            </article>
          </section>

          <section className="overview-grid">
            <article className="panel status-panel">
              <div className="panel-heading">
                <div><h2>Issue status</h2><p>Current distribution across all reports</p></div>
                <span className="panel-tag">BY STATUS</span>
              </div>
              <div className="status-list">
                {statuses.map((item) => (
                  <div className="status-row" key={item.status}>
                    <div className="status-name"><span className={`status-dot ${statusClass(item.status)}`} />{label(item.status)}</div>
                    <div className="status-track"><div className={`status-fill ${statusClass(item.status)}`} style={{ width: `${(number(item.count) / maxStatus) * 100}%` }} /></div>
                    <div className="status-count">{number(item.count)}</div>
                  </div>
                ))}
                {statuses.length === 0 && <p className="empty-state">No issue data available.</p>}
              </div>
            </article>

            <article className="panel priority-panel">
              <div className="panel-heading">
                <div><h2>Priority breakdown</h2><p>Reported issue severity</p></div>
                <span className="panel-tag">BY PRIORITY</span>
              </div>
              <div className="priority-list">
                {priorities.map((item) => (
                  <div className="priority-row" key={item.priority}>
                    <div className={`priority-label ${priorityClass(item.priority)}`}>{label(item.priority)}</div>
                    <div className="priority-track"><div className={`priority-fill ${priorityClass(item.priority)}`} style={{ width: `${(number(item.count) / maxPriority) * 100}%` }} /></div>
                    <div className="priority-count">{number(item.count)}</div>
                  </div>
                ))}
                {priorities.length === 0 && <p className="empty-state">No priority data available.</p>}
              </div>
              <div className="critical-callout">
                <span className="critical-symbol">!</span>
                <div><strong>{number(summary.critical)} critical issues</strong><span>Require immediate attention</span></div>
              </div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel department-panel" id="departments">
              <div className="panel-heading">
                <div><h2>Department workload</h2><p>Municipal team activity and assignments</p></div>
                <span className="panel-tag">TEAMS</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Department</th><th>Workers</th><th>Active</th><th>Completed</th></tr></thead>
                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.name}>
                        <td className="department-name">{department.name}</td>
                        <td>{number(department.workers)}</td>
                        <td><span className="table-number active-number">{number(department.active_assignments)}</span></td>
                        <td><span className="table-number completed-number">{number(department.completed_assignments)}</span></td>
                      </tr>
                    ))}
                    {departments.length === 0 && <tr><td colSpan={4}>No department data.</td></tr>}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel ward-panel" id="wards">
              <div className="panel-heading">
                <div><h2>Issues by ward</h2><p>Geographic distribution of reports</p></div>
                <span className="panel-tag">AREAS</span>
              </div>
              <div className="ward-list">
                {wards.map((ward, index) => (
                  <div className="ward-row" key={ward.name}>
                    <div className="ward-info"><span className="ward-rank">{String(index + 1).padStart(2, "0")}</span><span>{ward.name}</span><strong>{number(ward.issue_count)}</strong></div>
                    <div className="ward-track"><div className="ward-fill" style={{ width: `${(number(ward.issue_count) / maxWard) * 100}%` }} /></div>
                  </div>
                ))}
                {wards.length === 0 && <p className="empty-state">No ward data available.</p>}
              </div>
            </article>
          </section>

          <section className="panel recent-panel" id="recent">
            <div className="panel-heading">
              <div><h2>Recently reported issues</h2><p>Latest complaints submitted by citizens</p></div>
              <span className="panel-tag">LATEST 7</span>
            </div>
            <div className="table-wrap">
              <table className="recent-table">
                <thead><tr><th>Issue</th><th>Category</th><th>Ward</th><th>Priority</th><th>Status</th><th>Reported</th></tr></thead>
                <tbody>
                  {recentIssues.map((issue) => (
                    <tr key={issue.issue_id}>
                      <td><div className="issue-title">CF-{String(issue.issue_id).padStart(4, "0")}</div><div className="issue-description">{issue.description}</div></td>
                      <td>{issue.category}</td>
                      <td>{issue.ward}</td>
                      <td><span className={`priority-pill ${priorityClass(issue.priority)}`}>{label(issue.priority)}</span></td>
                      <td><span className={`status-pill ${statusClass(issue.status)}`}>{label(issue.status)}</span></td>
                      <td className="date-cell">{formatDate(issue.reported_at)}</td>
                    </tr>
                  ))}
                  {recentIssues.length === 0 && <tr><td colSpan={6}>No reported issues yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="footer">
            <span>CivicFlow · Smart Civic Issue Management</span>
            <span>Dashboard data is queried directly from PostgreSQL</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
