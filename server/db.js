import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Support for connection string (DATABASE_URL) or individual parameters
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string directly (for Neon, Railway, etc.)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL.includes("neon.tech") ||
      process.env.DATABASE_URL.includes("sslmode=require")
        ? {
            rejectUnauthorized: false,
          }
        : false,
  };
} else {
  // Use individual parameters
  poolConfig = {
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "cal_clone",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || 5432,
    ssl:
      process.env.DB_SSL === "true" ||
      process.env.DB_HOST?.includes("neon.tech")
        ? {
            rejectUnauthorized: false,
          }
        : false,
  };
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
