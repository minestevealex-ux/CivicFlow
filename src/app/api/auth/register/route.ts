import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withDbRole } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const phone = String(body.phone || "").trim() || null;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (name.length > 120 || email.length > 255 || password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: "Check your details. Password must be 8–72 characters." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await withDbRole(
      "civicflow_auth",
      { loginEmail: email },
      (client) =>
        client.query(
          `INSERT INTO citizen (name, email, phone, password_hash, role)
           VALUES ($1, $2, $3, $4, 'citizen')
           RETURNING citizen_id, name, email, role`,
          [name, email, phone, passwordHash]
        )
    );

    const row = result.rows[0];
    const user = {
      id: row.citizen_id,
      name: row.name,
      email: row.email,
      role: row.role,
    };

    await createSession(user);
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create account." },
      { status: 500 }
    );
  }
}
