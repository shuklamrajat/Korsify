import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || "";
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || "";
const APPLE_KEY_ID = process.env.APPLE_KEY_ID || "";
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY || "";
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Initialize OAuth strategies
export function initializeOAuth() {
  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with Google ID
        let user = await storage.getUserByGoogleId(profile.id);
        
        if (!user) {
          // Check if user exists with same email
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
          
          if (user) {
            // Link existing account with Google
            await storage.updateUser(user.id, {
              googleId: profile.id,
              authProvider: 'google',
              emailVerified: true,
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl
            });
          } else {
            // Create new user
            user = await storage.createUser({
              email: profile.emails?.[0]?.value || "",
              googleId: profile.id,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
              authProvider: 'google',
              emailVerified: true
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }));
  }

  // Apple OAuth Strategy
  if (APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
      clientID: APPLE_CLIENT_ID,
      teamID: APPLE_TEAM_ID,
      keyID: APPLE_KEY_ID,
      privateKeyString: APPLE_PRIVATE_KEY,
      callbackURL: `${BASE_URL}/api/auth/apple/callback`,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        // Apple profile may not have email on subsequent logins
        const email = profile.email || req.body?.email;
        
        // Check if user exists with Apple ID
        let user = await storage.getUserByAppleId(profile.id);
        
        if (!user && email) {
          // Check if user exists with same email
          user = await storage.getUserByEmail(email);
          
          if (user) {
            // Link existing account with Apple
            await storage.updateUser(user.id, {
              appleId: profile.id,
              authProvider: 'apple',
              emailVerified: true
            });
          } else {
            // Create new user
            user = await storage.createUser({
              email,
              appleId: profile.id,
              firstName: profile.name?.firstName,
              lastName: profile.name?.lastName,
              authProvider: 'apple',
              emailVerified: true
            });
          }
        }
        
        if (!user) {
          return done(new Error("Unable to authenticate with Apple"));
        }
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }));
  }

  // LinkedIn OAuth Strategy
  if (LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET) {
    passport.use(new LinkedInStrategy({
      clientID: LINKEDIN_CLIENT_ID,
      clientSecret: LINKEDIN_CLIENT_SECRET,
      callbackURL: `${BASE_URL}/api/auth/linkedin/callback`,
      scope: ['openid', 'profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with LinkedIn ID
        let user = await storage.getUserByLinkedInId(profile.id);
        
        if (!user) {
          // Check if user exists with same email
          user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
          
          if (user) {
            // Link existing account with LinkedIn
            await storage.updateUser(user.id, {
              linkedinId: profile.id,
              authProvider: 'linkedin',
              emailVerified: true,
              profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl
            });
          } else {
            // Create new user
            user = await storage.createUser({
              email: profile.emails?.[0]?.value || "",
              linkedinId: profile.id,
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              profileImageUrl: profile.photos?.[0]?.value,
              authProvider: 'linkedin',
              emailVerified: true
            });
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }));
  }

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}