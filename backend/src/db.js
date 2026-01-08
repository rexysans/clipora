import pkg from "pg";
const { Pool } = pkg;

// Use DATABASE_URL in production, individual configs in development
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      user: process.env.DB_USER || "stream_app",
      host: process.env.DB_HOST || "127.0.0.1",
      database: process.env.DB_NAME || "stream_platform",
      password: process.env.DB_PASSWORD || "streampass",
      port: parseInt(process.env.DB_PORT || "5432"),
    });

// Test connection
pool.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

export default pool;
