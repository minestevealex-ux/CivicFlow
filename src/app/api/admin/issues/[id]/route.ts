import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withDbRole } from "@/lib/db";

const allowedStatuses = [
  "submitted", "under_review", "assigned",
  "in_progress", "resolved", "rejected",
];

const allowedPriorities = ["low", "medium", "high", "critical"];

async function isAdmin(userId: number) {
  const result = await withDbRole(
    "civicflow_auth",
    { userId },
    (client) =>
      client.query(
        "SELECT role FROM citizen WHERE citizen_id = $1",
        [userId]
      )
  );

  return result.rows[0]?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || !(await isAdmin(session.id))) {
      return NextResponse.json(
        { success: false, message: "Forbidden." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const issueId = Number(id);

    if (!Number.isInteger(issueId) || issueId < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid issue ID." },
        { status: 400 }
      );
    }

    let body: { status?: unknown; priority?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const status = body.status === undefined ? null : String(body.status);
    const priority = body.priority === undefined ? null : String(body.priority);

    if (status === null && priority === null) {
      return NextResponse.json(
        { success: false, message: "No changes supplied." },
        { status: 400 }
      );
    }

    if (status !== null && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status." },
        { status: 400 }
      );
    }

    if (priority !== null && !allowedPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, message: "Invalid priority." },
        { status: 400 }
      );
    }

    const result = await withDbRole(
      "civicflow_admin",
      { userId: session.id },
      (client) =>
        client.query(
          `UPDATE issue
           SET status = COALESCE($1, status),
               priority = COALESCE($2, priority),
               resolved_at = CASE
                 WHEN $1 = 'resolved' THEN COALESCE(resolved_at, CURRENT_TIMESTAMP)
                 WHEN $1 IS NOT NULL THEN NULL
                 ELSE resolved_at
               END
           WHERE issue_id = $3
           RETURNING issue_id`,
          [status, priority, issueId]
        )
    );

    if (!result.rowCount) {
      return NextResponse.json(
        { success: false, message: "Issue not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Issue details updated successfully.",
    });
  } catch (error) {
    console.error("Issue update failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update issue." },
      { status: 500 }
    );
  }
}
