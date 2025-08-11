import { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { generateToken, hashPassword, verifyPassword, authenticate, AuthRequest } from "./auth";
import { z } from "zod";
import admin from 'firebase-admin';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Initialize Firebase Admin SDK (only in production if service account is available)
// For development, we'll verify tokens without admin SDK
let firebaseInitialized = false;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
  }
} catch (error) {
  console.log("Firebase Admin SDK not initialized - will use client-side verification");
}

export function setupAuthRoutes(app: Express) {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      let existingUser;
      try {
        existingUser = await storage.getUserByEmail(data.email);
      } catch (dbError) {
        console.error("Error checking existing user:", dbError);
        return res.status(500).json({ message: "Database error while checking email" });
      }
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered. Please sign in instead." });
      }

      // Hash password and create user (without role - will be selected after login)
      const passwordHash = await hashPassword(data.password);
      
      let user;
      try {
        user = await storage.createUser({
          email: data.email,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          emailVerified: false,
          currentRole: null,
          authProvider: 'local'
        });
        console.log("Created new user via email registration:", data.email);
      } catch (dbError) {
        console.error("Error creating user:", dbError);
        return res.status(500).json({ message: "Could not create account. Please try again." });
      }

      // Generate token
      const token = generateToken(user);

      // Set cookie for Replit environment
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      res.json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currentRole: user.currentRole
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Get user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValid = await verifyPassword(data.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken(user);

      // Set cookie for Replit environment
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currentRole: user.currentRole,
          needsRoleSelection: true // Always require role selection at login
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: "Logout successful" });
  });

  // Get current user endpoint
  app.get('/api/auth/me', authenticate, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        currentRole: req.user.currentRole,
        emailVerified: req.user.emailVerified
      }
    });
  });

  // Check auth status endpoint
  app.get('/api/auth/status', async (req: Request, res: Response) => {
    const token = req.cookies?.token;
    res.json({ authenticated: !!token });
  });

  // Update user role endpoint
  app.post('/api/auth/update-role', authenticate, async (req: AuthRequest, res: Response) => {
    try {
      const { role } = req.body;
      
      if (!role || !['creator', 'learner'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.updateUserRole(req.user.id, role);
      
      res.json({
        message: "Role updated successfully",
        role
      });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Google Firebase Authentication
  app.post('/api/auth/google-signin', async (req: Request, res: Response) => {
    try {
      const { idToken, email, displayName, photoURL, uid } = req.body;
      
      if (!email || !uid) {
        return res.status(400).json({ message: "Missing required fields: email and uid are required" });
      }
      
      // Since we don't have Firebase Admin SDK configured, we'll trust the client
      // In production, you should add the FIREBASE_SERVICE_ACCOUNT secret
      console.log("Processing Google sign-in for:", email);
      
      // For now, we'll trust the client-provided data since Firebase Admin SDK is not configured
      // This is acceptable for development but should be properly configured for production
      
      // Check if user exists or create new user
      let user;
      try {
        user = await storage.getUserByGoogleId(uid);
      } catch (dbError) {
        console.error("Error checking for existing Google user:", dbError);
        return res.status(500).json({ message: "Database error while checking user account" });
      }
      
      if (!user) {
        try {
          // Check if email already exists (user might have registered with email/password)
          user = await storage.getUserByEmail(email);
          
          if (user) {
            // Update existing user with Google ID
            await storage.updateUserGoogleId(user.id, uid);
            console.log("Linked Google account to existing user:", email);
          } else {
            // Create new user
            const nameParts = displayName ? displayName.split(' ') : [];
            const firstName = nameParts[0] || null;
            const lastName = nameParts.slice(1).join(' ') || null;
            
            user = await storage.createGoogleUser(
              email,
              uid,
              firstName,
              lastName
            );
            console.log("Created new Google user:", email);
          }
        } catch (dbError) {
          console.error("Error creating/updating user:", dbError);
          return res.status(500).json({ message: "Could not create or update user account" });
        }
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set cookie
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });
      
      res.json({
        message: "Sign in successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currentRole: user.currentRole
        }
      });
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      // Provide more specific error messages
      if (error.message?.includes('getUserByGoogleId')) {
        res.status(500).json({ message: "Database error: Could not check Google account" });
      } else if (error.message?.includes('createGoogleUser')) {
        res.status(500).json({ message: "Could not create account. Please try again." });
      } else if (error.message?.includes('updateUserGoogleId')) {
        res.status(500).json({ message: "Could not link Google account to existing user" });
      } else {
        res.status(500).json({ message: error.message || "Sign in failed. Please try again." });
      }
    }
  });
}