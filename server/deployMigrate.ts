import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Deployment-specific migration runner with enhanced error recovery
export async function runDeploymentMigrations() {
  let pool: Pool | null = null;
  
  console.log("[DEPLOY] Starting deployment-specific database migrations...");
  
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for migrations");
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test connection
    try {
      await pool.query("SELECT 1");
      console.log("[DEPLOY] Database connection established");
    } catch (err) {
      console.error("[DEPLOY] Cannot connect to database:", err);
      throw new Error("Database connection failed");
    }
    
    // Create migration tracking table if not exists
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL UNIQUE,
          created_at bigint
        )
      `);
    } catch (err) {
      console.log("[DEPLOY] Migration table might already exist, continuing...");
    }
    
    // Quick check: if all main tables exist and we have migration records, skip
    try {
      const tableCheck = await pool.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('ai_processing_jobs', 'users', 'courses', 'modules', 'lessons')
      `);
      
      const migrationCheck = await pool.query(`
        SELECT COUNT(*) as count FROM __drizzle_migrations
      `);
      
      const tableCount = parseInt(tableCheck.rows[0]?.count || "0");
      const migrationCount = parseInt(migrationCheck.rows[0]?.count || "0");
      
      if (tableCount >= 5 && migrationCount > 0) {
        console.log("[DEPLOY] Database schema is complete and migrations are recorded. Skipping migration run.");
        return;
      }
    } catch (err) {
      console.log("[DEPLOY] Could not perform quick schema check, proceeding with migrations");
    }
    
    // Read migration files
    const migrationFiles = readdirSync("./migrations")
      .filter(file => file.endsWith(".sql"))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log("[DEPLOY] No migration files found");
      return;
    }
    
    for (const file of migrationFiles) {
      // Check if already applied
      const applied = await pool.query(
        "SELECT id FROM __drizzle_migrations WHERE hash = $1",
        [file]
      );
      
      if (applied.rows.length > 0) {
        console.log(`[DEPLOY] ✓ Migration already applied: ${file}`);
        continue;
      }
      
      console.log(`[DEPLOY] Applying migration: ${file}`);
      const filePath = join("./migrations", file);
      const migrationSql = readFileSync(filePath, "utf8");
      
      // Split into statements
      const statements = migrationSql
        .split("--> statement-breakpoint")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      let allSuccess = true;
      
      // Execute each statement individually (not in transaction for deployment)
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          await pool.query(statement);
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          
          // These errors are OK - table/constraint already exists
          if (errorMsg.includes("already exists") || 
              errorMsg.includes("duplicate key") ||
              errorMsg.includes("relation") && errorMsg.includes("exists")) {
            console.log(`[DEPLOY]   - Skipped (already exists): ${statement.substring(0, 40)}...`);
            continue;
          }
          
          // For other errors, log but continue
          console.error(`[DEPLOY]   - Error: ${errorMsg}`);
          allSuccess = false;
        }
      }
      
      // Always mark migration as applied to prevent re-runs
      try {
        await pool.query(
          "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING",
          [file, Date.now()]
        );
        console.log(`[DEPLOY] ${allSuccess ? '✓' : '⚠'} Marked migration as applied: ${file}`);
      } catch (err) {
        console.log(`[DEPLOY] Could not record migration ${file}, but continuing`);
      }
    }
    
    console.log("[DEPLOY] Migration process completed");
    
  } catch (error) {
    console.error("[DEPLOY] Migration error:", error);
    // Don't throw - let the app try to start anyway
  } finally {
    if (pool) {
      try {
        await pool.end();
      } catch (err) {
        console.error("[DEPLOY] Error closing connection:", err);
      }
    }
  }
}

// Note: This function is meant to be called from server/index.ts during production startup
// It's designed to be fault-tolerant and won't crash the application if migrations fail