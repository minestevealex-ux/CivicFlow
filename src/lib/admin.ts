import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { withDbRole } from "@/lib/db";

export async function requireAdmin() {
  const session = await getSession();

  if (!session) redirect("/login");

  const result = await withDbRole(
    "civicflow_auth",
    { userId: session.id },
    (client) =>
      client.query(
        "SELECT role FROM citizen WHERE citizen_id = $1",
        [session.id]
      )
  );

  if (result.rows[0]?.role !== "admin") redirect("/");

  return session;
}
