import { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { generateToken, hashPassword, verifyPassword, authenticate, AuthRequest } from "./auth";
import { z } from "zod";

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

export function setupAuthRoutes(app: Express) {
  // Add cookie parser middleware
  app.use(cookieParser());

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user (without role - will be selected after login)
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser(
        data.email,
        passwordHash,
        data.firstName,
        data.lastName
      );

      // Generate token
      const token = generateToken(user);

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          currentRole: user.currentRole,
          needsRoleSelection: !user.currentRole
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
        userType: req.user.userType,
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
}