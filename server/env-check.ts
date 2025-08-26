import { log } from "./vite.js";

export function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL'];
  const recommendedEnvVars = ['GEMINI_API_KEY', 'JWT_SECRET'];

  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingRequired.push(envVar);
    }
  }

  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      missingRecommended.push(envVar);
    }
  }

  // In production (Cloud Run), be more lenient during initial deployment
  if (process.env.NODE_ENV === "production" && missingRequired.length > 0) {
    log(`Warning: Missing required environment variables in production: ${missingRequired.join(', ')}`);
    log("This may cause runtime errors when those features are used");
    // Don't throw error in production - let the app start and handle errors gracefully
  } else if (missingRequired.length > 0) {
    const error = `Missing required environment variables: ${missingRequired.join(', ')}`;
    log(`Environment validation failed: ${error}`);
    throw new Error(error);
  }

  if (missingRecommended.length > 0) {
    log(`Warning: Missing recommended environment variables: ${missingRecommended.join(', ')}`);
  }

  log("Environment validation passed");
}