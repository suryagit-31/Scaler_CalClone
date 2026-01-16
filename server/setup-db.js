import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log("Creating database tables...");

    // Read and execute database.sql
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "database.sql"),
      "utf8"
    );

    await client.query(schemaSQL);
    console.log("✓ Database tables created successfully");

    // Read and execute seed.sql
    console.log("Seeding database with sample data...");
    const seedSQL = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");

    await client.query(seedSQL);
    console.log("✓ Sample data inserted successfully");

    // Drop old availability table if it exists (migration completed)
    try {
      await client.query("DROP TABLE IF EXISTS availability CASCADE");
      console.log("✓ Old availability table removed");
    } catch (error) {
      // Table might not exist, which is fine
      console.log("Old availability table already removed or doesn't exist");
    }

    // Verify the data
    const eventTypesResult = await client.query(
      "SELECT COUNT(*) FROM event_types"
    );
    const schedulesResult = await client.query(
      "SELECT COUNT(*) FROM availability_schedules"
    );
    const slotsResult = await client.query(
      "SELECT COUNT(*) FROM availability_slots"
    );

    console.log("\n✓ Database setup complete!");
    console.log(`  - Event types: ${eventTypesResult.rows[0].count}`);
    console.log(`  - Availability schedules: ${schedulesResult.rows[0].count}`);
    console.log(`  - Availability slots: ${slotsResult.rows[0].count}`);
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
