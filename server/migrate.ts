import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { log } from "./vite.js";

export async function runMigrations() {
  try {
    log("Starting database migrations...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for migrations");
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check if migrations table exists and create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    
    // Read migration files
    const migrationFiles = readdirSync("./migrations")
      .filter(file => file.endsWith(".sql"))
      .sort();
    
    for (const file of migrationFiles) {
      const filePath = join("./migrations", file);
      const migrationSql = readFileSync(filePath, "utf8");
      
      // Check if migration already applied
      const result = await pool.query(
        "SELECT id FROM __drizzle_migrations WHERE hash = $1",
        [file]
      );
      
      if (result.rows.length === 0) {
        // Apply migration
        await pool.query(migrationSql);
        
        // Record migration
        await pool.query(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)",
          [file, Date.now()]
        );
        
        log(`Applied migration: ${file}`);
      } else {
        log(`Migration already applied: ${file}`);
      }
    }
    
    await pool.end();
    log("Database migrations completed successfully");
  } catch (error) {
    log(`Database migration error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}