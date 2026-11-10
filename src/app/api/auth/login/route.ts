import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withDbRole } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await withDbRole(
      "civicflow_auth",
      { loginEmail: email },
      (client) =>
        client.query(
          `SELECT citizen_id, name, email, password_hash, role
           FROM citizen
           WHERE email = $1`,
          [email]
        )
    );

    const row = result.rows[0];

    if (!row || !row.password_hash || !(await bcrypt.compare(password, row.password_hash))) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = {
      id: row.citizen_id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    await createSession(user);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to log in." },
      { status: 500 }
    );
  }
}
