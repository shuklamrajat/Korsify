import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Check if we're using Cloud SQL or Neon
const isCloudSQL = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.includes('neon');

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure based on environment
let pool: any;
let db: any;

if (isCloudSQL) {
  // Use standard PostgreSQL driver for Cloud SQL
  pool = new PgPool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: false, // Cloud SQL proxy handles SSL
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzlePg(pool, { schema });
} else {
  // Use Neon for development or if DATABASE_URL contains 'neon'
  neonConfig.webSocketConstructor = ws;
  
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
}

export { db, pool };