import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: User;
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      userType: user.userType 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Check for token in cookies or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      // Allow access to auth routes without token
      if (req.path.startsWith("/api/auth/")) {
        return next();
      }
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; userType: string };
    
    // Get user from database
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
}

// Optional authentication middleware (for public routes that can work with or without auth)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; userType: string };
    const user = await storage.getUser(decoded.id);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
}