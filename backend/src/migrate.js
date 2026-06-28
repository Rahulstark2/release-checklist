import { pool } from "./db.js";

const SQL = `
CREATE TABLE IF NOT EXISTS releases (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  release_date TIMESTAMPTZ NOT NULL,
  additional_info TEXT DEFAULT '',
  steps JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function migrate() {
  try {
    await pool.query(SQL);
    console.log("Migration complete: 'releases' table is ready.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
