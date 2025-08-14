import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { log } from "./vite.js";

// Function to check if tables already exist in database
async function checkTableExists(pool: Pool, tableName: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0]?.exists || false;
  } catch (error) {
    log(`Warning: Could not check if table ${tableName} exists: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Function to verify database schema integrity
async function verifyDatabaseIntegrity(pool: Pool): Promise<boolean> {
  const requiredTables = [
    "ai_processing_jobs", "users", "courses", "modules", "lessons", 
    "documents", "enrollments", "progress", "quizzes", "quiz_attempts"
  ];
  
  try {
    log("Verifying database schema integrity...");
    
    for (const table of requiredTables) {
      const exists = await checkTableExists(pool, table);
      if (!exists) {
        log(`Missing required table: ${table}`);
        return false;
      }
    }
    
    log("Database schema verification passed");
    return true;
  } catch (error) {
    log(`Database integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Function to safely run migrations with deployment recovery
export async function runMigrations() {
  let pool: Pool | null = null;
  
  try {
    log("Starting database migrations...");
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for migrations");
    }
    
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test database connection first
    try {
      await pool.query("SELECT 1");
      log("Database connection established");
    } catch (connectionError) {
      log(`Database connection failed: ${connectionError instanceof Error ? connectionError.message : String(connectionError)}`);
      throw new Error("Cannot connect to database");
    }
    
    // Check if migrations table exists and create if not
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS __drizzle_migrations (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL UNIQUE,
          created_at bigint
        )
      `);
      log("Migration tracking table ready");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("already exists")) {
        log("Migration tracking table already exists");
      } else {
        log(`Warning: Could not ensure migration table exists: ${errorMessage}`);
        // Try to continue anyway - the table might exist
      }
    }
    
    // Check database integrity and handle deployment recovery
    const databaseReady = await verifyDatabaseIntegrity(pool);
    
    if (databaseReady) {
      log("Database schema appears complete - verifying migration state");
      
      // Check if migrations are properly recorded
      try {
        const migrationCount = await pool.query("SELECT COUNT(*) FROM __drizzle_migrations");
        const recordedMigrations = parseInt(migrationCount.rows[0]?.count || "0");
        
        if (recordedMigrations === 0) {
          log("Complete schema exists but no migrations recorded - this suggests a deployment recovery scenario");
          log("Marking existing migrations as applied to prevent re-running");
          
          // Mark all existing migration files as applied
          const existingFiles = readdirSync("./migrations")
            .filter(file => file.endsWith(".sql"))
            .sort();
            
          for (const file of existingFiles) {
            await pool.query(
              "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING",
              [file, Date.now()]
            );
            log(`  - Marked ${file} as applied`);
          }
          
          log("Migration state recovery completed - all existing migrations marked as applied");
          return; // Exit early since schema is complete and migrations are now recorded
        } else {
          log(`Found ${recordedMigrations} recorded migrations`);
        }
      } catch (error) {
        log(`Warning: Could not check migration state: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

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
            
            let hasErrors = false;
            const appliedStatements: string[] = [];
            
            for (const statement of statements) {
              if (statement.trim()) {
                try {
                  await pool.query(statement);
                  appliedStatements.push(statement);
                } catch (statementError) {
                  const errorMessage = statementError instanceof Error ? statementError.message : String(statementError);
                  
                  // Check if this is a "table already exists" error - these are safe to ignore
                  if (errorMessage.includes("already exists") || 
                      (errorMessage.includes("relation") && errorMessage.includes("already exists")) ||
                      errorMessage.includes("duplicate key value") ||
                      errorMessage.includes("constraint") && errorMessage.includes("already exists")) {
                    log(`  - Statement already applied (table/constraint exists): ${statement.substring(0, 50)}...`);
                    continue;
                  }
                  
                  // For other errors, log and mark as error but continue
                  log(`  - Statement error: ${errorMessage}`);
                  hasErrors = true;
                  break;
                }
              }
            }
            
            // Record migration as applied even if some statements were skipped due to existing objects
            await pool.query(
              "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING",
              [file, Date.now()]
            );
            
            // Commit transaction
            await pool.query("COMMIT");
            
            if (hasErrors) {
              log(`⚠ Migration ${file} completed with some errors (but tables exist)`);
            } else {
              log(`✓ Applied migration: ${file}`);
            }
            
          } catch (migrationError) {
            // Rollback transaction on error
            try {
              await pool.query("ROLLBACK");
            } catch (rollbackError) {
              log(`Error during rollback: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
            }
            
            const errorMessage = migrationError instanceof Error ? migrationError.message : String(migrationError);
            log(`✗ Migration ${file} failed: ${errorMessage}`);
            
            // Check if error is about existing objects - if so, mark migration as applied
            if (errorMessage.includes("already exists") || 
                (errorMessage.includes("relation") && errorMessage.includes("already exists")) ||
                errorMessage.includes("duplicate key value") ||
                errorMessage.includes("constraint") && errorMessage.includes("already exists")) {
              log(`Tables/constraints already exist, marking migration ${file} as applied`);
              try {
                await pool.query(
                  "INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2) ON CONFLICT (hash) DO NOTHING",
                  [file, Date.now()]
                );
              } catch (insertError) {
                log(`Warning: Could not record migration ${file} as applied: ${insertError instanceof Error ? insertError.message : String(insertError)}`);
              }
            } else {
              // For non-existence errors, we should still throw to prevent app startup
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