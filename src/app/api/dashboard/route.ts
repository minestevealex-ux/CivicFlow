import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withDbRole } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const admin = await withDbRole(
      "civicflow_auth",
      { userId: session.id },
      (client) =>
        client.query(
          "SELECT role FROM citizen WHERE citizen_id = $1",
          [session.id]
        )
    );

    if (admin.rows[0]?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const data = await withDbRole(
      "civicflow_admin",
      { userId: session.id },
      async (client) => {
        const [
          summary,
          statuses,
          priorities,
          departments,
          wards,
          recentIssues,
        ] = await Promise.all([
          client.query(`
            SELECT
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
              COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review')) AS pending,
              COUNT(*) FILTER (WHERE status IN ('assigned', 'in_progress')) AS active,
              COUNT(*) FILTER (WHERE priority = 'critical' AND status != 'resolved' AND status != 'rejected') AS critical
            FROM issue
          `),

          client.query(`
            SELECT status, COUNT(*) AS count
            FROM issue
            GROUP BY status
            ORDER BY count DESC
          `),

          client.query(`
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

          client.query(`
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

          client.query(`
            SELECT
              w.name,
              COUNT(i.issue_id) AS issue_count
            FROM ward w
            LEFT JOIN location l ON l.ward_id = w.ward_id
            LEFT JOIN issue i ON i.location_id = l.location_id
            GROUP BY w.ward_id, w.name
            ORDER BY issue_count DESC, w.name
          `),

          client.query(`
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

        return {
          summary: summary.rows[0],
          statuses: statuses.rows,
          priorities: priorities.rows,
          departments: departments.rows,
          wards: wards.rows,
          recentIssues: recentIssues.rows,
        };
      }
    );

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Dashboard query failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load dashboard data" },
      { status: 500 }
    );
  }
}
