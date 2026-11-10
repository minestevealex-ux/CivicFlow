import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withDbRole } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const issueId = Number(id);

    let body: { workerId?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body." },
        { status: 400 }
      );
    }

    const workerId = Number(body.workerId);

    if (
      !Number.isInteger(issueId) ||
      issueId < 1 ||
      !Number.isInteger(workerId) ||
      workerId < 1
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid issue or worker." },
        { status: 400 }
      );
    }

    const assigned = await withDbRole(
      "civicflow_admin",
      { userId: session.id },
      async (client) => {
        const issue = await client.query(
          "SELECT issue_id FROM issue WHERE issue_id = $1 FOR UPDATE",
          [issueId]
        );

        const worker = await client.query(
          `SELECT worker_id
           FROM worker
           WHERE worker_id = $1
             AND availability_status = 'available'
           FOR UPDATE`,
          [workerId]
        );

        if (!issue.rowCount || !worker.rowCount) {
          return false;
        }

        await client.query(
          `INSERT INTO assignment (issue_id, worker_id, status)
           VALUES ($1, $2, 'pending')`,
          [issueId, workerId]
        );

        await client.query(
          "UPDATE worker SET availability_status = 'busy' WHERE worker_id = $1",
          [workerId]
        );

        await client.query(
          `UPDATE issue
           SET status = 'assigned'
           WHERE issue_id = $1
             AND status NOT IN ('resolved', 'rejected')`,
          [issueId]
        );

        return true;
      }
    );

    if (!assigned) {
      return NextResponse.json(
        {
          success: false,
          message: "Issue or available worker not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Worker assigned successfully.",
    });
  } catch (error) {
    console.error("Assignment failed:", error);
    return NextResponse.json(
      { success: false, message: "Unable to assign worker." },
      { status: 500 }
    );
  }
}
