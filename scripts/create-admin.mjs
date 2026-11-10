import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!name || !email || !password) {
  console.error("Missing admin credentials.");
  process.exit(1);
}

if (
  name.length > 120 ||
  email.length > 255 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  password.length < 12 ||
  password.length > 72
) {
  console.error("Invalid name, email or password. Use a password of 12–72 characters.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

try {
  const hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO citizen (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = 'admin'
     RETURNING citizen_id, name, email, role`,
    [name, email, hash]
  );

  console.log("Administrator created or updated:");
  console.table(result.rows);
} catch (error) {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
