import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrate.js";
import { runDeploymentMigrations } from "./deployMigrate.js";
import { validateEnvironment } from "./env-check.js";

const app = express();
// Increase payload size limit to 100MB for large file uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add health check endpoint first (before any validation)
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV 
    });
  });

  // Validate environment variables (but don't exit in production if non-critical vars missing)
  try {
    validateEnvironment();
  } catch (error) {
    log(`Environment validation failed: ${error instanceof Error ? error.message : String(error)}`);
    if (process.env.NODE_ENV === "production") {
      log("Continuing startup despite validation errors in production...");
    } else {
      process.exit(1);
    }
  }

  // Run database migrations in production
  if (process.env.NODE_ENV === "production") {
    try {
      // Use deployment-specific migration runner for production
      await runDeploymentMigrations();
      log("Production migrations completed");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log(`Migration warning: ${errorMessage}`);
      // Don't exit - deployment migrations are designed to be fault-tolerant
      log("Continuing with application startup...");
    }
  } else {
    // In development, use the standard migration runner
    try {
      await runMigrations();
    } catch (error) {
      log(`Development migration error: ${error instanceof Error ? error.message : String(error)}`);
      // In development, we can continue even if migrations fail
    }
  }

  const server = await registerRoutes(app);

  // Test routes
  app.get('/test', (req, res) => {
    res.sendFile(path.resolve('./test.html'));
  });
  
  app.get('/test-template', (req, res) => {
    res.sendFile(path.resolve('./test-template.html'));
  });
  
  app.get('/test-auth', (req, res) => {
    res.sendFile(path.resolve('./test-auth.html'));
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
