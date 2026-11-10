
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM citizen) AS total_citizens,
        (SELECT COUNT(*) FROM issue) AS total_issues,
        (SELECT COUNT(*) FROM worker) AS total_workers,
        (SELECT COUNT(*) FROM department) AS total_departments
    `);

    return NextResponse.json({
      success: true,
      message: "CivicFlow database connected successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 500 }
    );
  }
}

