import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Most hosted Postgres providers (Render, Railway, Neon, Supabase) require SSL
// and provide a single DATABASE_URL connection string.
const useSSL = process.env.DATABASE_SSL !== "false";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PG client", err);
});
