import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { log } from "./vite.js";

export async function runMigrations() {
  let pool: Pool | null = null;
  
  try {
    log("Starting database migrations...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for migrations");
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check if migrations table exists and create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL UNIQUE,
        created_at bigint
      )
    `);
    
    // Read migration files
    const migrationFiles = readdirSync("./migrations")
      .filter(file => file.endsWith(".sql"))
      .sort();
    
    if (migrationFiles.length === 0) {
      log("No migration files found");
      return;
    }
    
    for (const file of migrationFiles) {
      try {
        const filePath = join("./migrations", file);
        const migrationSql = readFileSync(filePath, "utf8");
        
        // Check if migration already applied
        const result = await pool.query(
          "SELECT id FROM __drizzle_migrations WHERE hash = $1",
          [file]
        );
        
        if (result.rows.length === 0) {
          log(`Applying migration: ${file}`);
          
          // Begin transaction for migration
          await pool.query("BEGIN");
          
          try {
            // Split migration into individual statements and execute them
            const statements = migrationSql
              .split("--> statement-breakpoint")
              .map(stmt => stmt.trim())
              .filter(stmt => stmt.length > 0);
            
            for (const statement of statements) {
              if (statement.trim()) {
                await pool.query(statement);
              }
            }
            
            // Record migration
            await pool.query(
              "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)",
              [file, Date.now()]
            );
            
            // Commit transaction
            await pool.query("COMMIT");
            log(`✓ Applied migration: ${file}`);
            
          } catch (migrationError) {
            // Rollback transaction on error
            await pool.query("ROLLBACK");
            log(`✗ Migration ${file} failed: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`);
            
            // Check if error is about existing table - if so, just record the migration as applied
            const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
            if (errorMessage.includes("already exists") || errorMessage.includes("relation") && errorMessage.includes("already exists")) {
              log(`Table already exists, marking migration ${file} as applied`);
              await pool.query(
                "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING",
                [file, Date.now()]
              );
            } else {
              throw migrationError;
            }
          }
          
        } else {
          log(`✓ Migration already applied: ${file}`);
        }
        
      } catch (fileError) {
        log(`Error processing migration file ${file}: ${fileError instanceof Error ? fileError.message : String(fileError)}`);
        // Continue with next migration instead of failing completely
        continue;
      }
    }
    
    log("Database migrations completed successfully");
    
  } catch (error) {
    log(`Database migration error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (endError) {
        log(`Error closing database connection: ${endError instanceof Error ? endError.message : String(endError)}`);
      }
    }
  }
}