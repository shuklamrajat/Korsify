# Korsify - AI-Powered Educational Platform

## Overview
Korsify is an AI-powered educational platform designed to transform documents into structured online courses using Google's Gemini AI. It features a 5-phase AI pipeline for document processing, course generation, and content creation, supporting multiple file formats and languages. The platform aims to streamline the creation of educational content, offering features like comprehensive quiz management, real-time learning metrics, and advanced source referencing, all powered by AI to deliver a personalized and efficient learning experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (Updated: 2025-08-18 06:12 PM)
- **Database Migration System**: Added automatic migration system for production deployments
- **Environment Validation**: Added comprehensive environment variable validation on startup
- **Health Check Endpoint**: Added /api/health endpoint for deployment verification
- **Production Dependencies**: Moved drizzle-kit to production dependencies for deployment support
- **Deployment Configuration**: Added deployment config and migration automation for production environments
- **Enhanced Migration System**: Completely redesigned migration system with deployment recovery capabilities, including:
  - Database integrity verification to detect existing schemas
  - Automatic migration state recovery for deployment scenarios
  - Graceful handling of "table already exists" errors without crashing
  - Transaction-based migration execution with rollback support
  - Smart error detection to distinguish between critical errors and benign existence conflicts
  - Connection testing and retry logic for production deployments
- **Content Deduplication System**: Implemented comprehensive deduplication to prevent duplicate content generation:
  - Added explicit AI prompt instructions to ensure unique modules, lessons, and quiz questions
  - Created deduplication utility with Levenshtein distance-based similarity detection
  - Implemented validation and cleaning of generated course structures before saving
  - Added title uniqueness checks for modules, lessons, and quiz questions
  - Automatic renaming of duplicate content with counter suffixes when needed
  - Configurable similarity thresholds (85-90%) for duplicate detection
- **User Settings Priority System**: Completely reworked generation settings to ensure user preferences override defaults:
  - Removed all hardcoded fallback defaults that were overriding user choices
  - Quiz generation now strictly follows user-specified question counts (no more default 5 questions)
  - Quiz frequency strictly follows user selection (either per lesson OR per module, never both)
  - Difficulty level properly influences both content complexity and quiz question difficulty
  - AI prompts explicitly instructed to generate EXACTLY the number of questions specified
  - All generated content strictly tied to source document regardless of difficulty level
- **Mandatory Quiz Generation System**: Ensured 100% compliance with user quiz preferences:
  - Quiz generation is now MANDATORY when enabled - no silent failures or missing quizzes
  - Added retry logic with up to 3 attempts if quiz generation fails
  - Validation ensures exact number of questions requested is generated
  - Error thrown if quiz generation fails after retries to prevent incomplete courses
  - Removed conditional checks that prevented quiz generation
  - Quiz frequency strictly enforced - EVERY lesson gets quiz when "per lesson" selected
  - Module quizzes generated for EVERY module when "per module" selected
  - Added detailed logging for quiz generation success and failures
- **Module Count Customization**: Added user control over number of modules generated:
  - New setting in Generation Settings dialog allows selection from 1-6 modules
  - Default remains 3 modules when not specified
  - Module count properly passed from frontend to backend generation pipeline
  - AI prompts instructed to generate exact number of modules requested by user

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, utilizing Tailwind CSS with shadcn/ui components for styling, Wouter for routing, and TanStack Query for server state management. Vite is used for building. The UI adheres to a component-based architecture, emphasizing reusability and a consistent design system with responsive design.

### Backend Architecture
The backend is a Node.js/Express application written in TypeScript (ES modules). It uses PostgreSQL with Drizzle ORM (hosted on Neon Database) for data persistence. Multer handles file uploads (PDF, DOC, DOCX, TXT, MD), and Google Gemini 2.5 Flash API is integrated for AI-driven content generation.

### Data Storage Solutions
PostgreSQL is the chosen database, managed by Drizzle ORM for type safety. The schema supports users, documents, courses, modules, lessons, quizzes, enrollments, and progress tracking. Database migrations are handled via Drizzle Kit. Neon serverless PostgreSQL provides scalability and ease of deployment.

### Key Components & Features
- **AI Processing Pipeline**: A 5-phase system for document analysis, content analysis, content generation, validation, and finalization of educational courses.
- **User Management System**: Production-ready authentication with secure registration, bcryptjs password hashing, JWT token-based authentication (httpOnly cookies), session management, and role-based access for creators and learners.
- **Course Management**: Comprehensive workflow for course creation, including module/lesson organization, AI-generated quizzes, and progress tracking.
- **File Processing**: Supports multiple document formats (PDF, DOC, DOCX, TXT, MD) with validation and secure storage.
- **Enhanced Learning Features**: Includes real-time learning metrics (study time, streaks), research-based learning time estimations, personalized welcome widgets, rich text editor for lessons, and NotebookLM-style source referencing with document scrolling.

## External Dependencies

- **Google Gemini AI**: Primary AI service for content generation and analysis.
- **Neon Database**: Serverless PostgreSQL hosting.
- **Radix UI**: Headless UI components.
- **React Hook Form**: Form management and validation.
- **TanStack Query**: Server state management and caching.
- **Vite**: Build tool and development server.
- **TypeScript**: Language used across the stack.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: JavaScript bundling.
- **Multer**: File upload middleware.
- **Bcryptjs**: Password hashing.
- **Drizzle ORM**: Database ORM.
- **Firebase**: Google authentication.