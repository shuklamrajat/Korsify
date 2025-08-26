import { log } from "./vite.js";

export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    log(`Environment validation failed: ${error}`);
    throw new Error(error);
  }

  log("Environment validation passed");
}