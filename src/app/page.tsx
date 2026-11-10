import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CitizenPortal from "@/components/citizen-portal";

export const instant = false;

export default async function Home() {
  const user = await getSession();

  const [categoryResult, wardResult, complaintResult] = await Promise.all([
    pool.query("SELECT category_id, name FROM category ORDER BY name"),
    pool.query("SELECT ward_id, name, zone FROM ward ORDER BY name"),
    user && user.role === "citizen"
      ? pool.query(
          `SELECT i.issue_id, i.description, i.status, i.reported_at,
                  c.name AS category, w.name AS ward
           FROM issue i
           JOIN category c ON c.category_id = i.category_id
           JOIN location l ON l.location_id = i.location_id
           JOIN ward w ON w.ward_id = l.ward_id
           WHERE i.citizen_id = $1 AND i.is_anonymous = FALSE
           ORDER BY i.reported_at DESC`,
          [user.id]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return (
    <CitizenPortal
      categories={categoryResult.rows}
      wards={wardResult.rows}
      user={user}
      complaints={complaintResult.rows}
    />
  );
}
