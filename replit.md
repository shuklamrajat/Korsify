# Korsify - AI-Powered Educational Platform

## Overview

Korsify is a cutting-edge educational platform that transforms documents into structured online courses using Google's Gemini AI. The platform features a 5-phase AI pipeline for document processing, course generation, and educational content creation with support for multiple file formats and languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

**Latest Updates (January 27, 2025):**
- **Enhanced Source Referencing with Document Scrolling**
  - Fixed source referencing to scroll to relevant document sections when citations are clicked
  - Added document content expansion with highlighted citation context
  - Implemented smooth scrolling animations when navigating to citations
  - Added visual highlight animations (yellow fade) to show clicked citation locations
- **Revolutionary Rich Text Editor for Lessons**
  - Implemented TipTap-based rich text editor with comprehensive formatting tools
  - Added pre-built templates for Key Concepts, Examples, Warnings, Tips, Exercises, and Summaries
  - Full support for text formatting, alignment, lists, quotes, code blocks, images, and links
  - Toolbar with intuitive controls for headings, bold, italic, underline, highlight, and more
- **Enhanced Lesson Viewer for Learners**
  - Created beautiful lesson viewer with reading progress tracking
  - Styled content with enhanced typography and visual hierarchy
  - Added navigation between lessons with Previous/Next buttons
  - Integrated video support with embedded YouTube player
  - Attractive cards and layouts optimized for readability
- **Fixed Role Selection Flow** - Role selection screen now appears at every login as requested
  - Users must choose between Creator and Learner mode every time they log in
  - Welcome screen displays "Welcome to Korsify! How would you like to use the platform today?"
  - Fixed "Failed to update role" error that was preventing proper role selection
  - Removed userType field error in authentication endpoints
- **Implemented NotebookLM-Style Source Referencing**
  - Added SourceViewer component for displaying document citations
  - Created CitationRenderer for clickable inline citations [1], [2]
  - Split layout in course editor with toggleable source panel on left side
  - AI-generated content includes automatic citations linking back to source documents
  - Hover previews and click-to-highlight functionality for citations
- **Previous Feature Updates:**
  - Removed Templates Section from Creator Dashboard for streamlined experience
  - Added Quick Delete Functionality for courses with confirmation dialogs
  - Fixed Database Schema Issues - removed source_references column mismatch
  - Enhanced Course Management with quick delete buttons and confirmation dialogs
  - AI Course Generation with strict Module → Lessons hierarchy
  - Course Editor with full editing capabilities for all AI-generated content

**Previous Updates (January 24, 2025):**
- **MAJOR UPDATE: Implemented Complete Authentication System**
  - Replaced mock authentication with real user accounts using industry-standard security
  - Added secure password hashing with bcryptjs
  - Implemented JWT token-based authentication with httpOnly cookies
  - Created login/registration UI with email/password authentication
  - Added user type selection (creator/learner) during registration
  - Protected all API routes with authentication middleware
  - Added logout functionality with session management
  - Created dedicated authentication test page at `/test-auth` for testing
  - Database schema updated to include password hashing and email verification fields
- Fixed navigation auto-scrolling functionality by adding proper section IDs
- Resolved file upload "No file uploaded" error by updating apiRequest function
- Added comprehensive pricing section with Free, Pro, and Enterprise plans
- All major functionality working: document upload, AI processing, course generation, and authentication
- Application is production-ready with secure user management

## System Architecture

### Frontend Architecture
The frontend is built using a modern React-based stack with TypeScript:
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

The UI follows a component-based architecture with reusable shadcn/ui components, maintaining consistency across the application with a custom design system featuring brand colors and proper responsive design.

### Backend Architecture
The backend uses a Node.js/Express setup with modern ES modules:
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for file uploads with support for PDF, DOC, DOCX, TXT, and MD files
- **AI Integration**: Google Gemini 2.5 Flash API for content generation

### Data Storage Solutions
The application uses a PostgreSQL database with the following key design decisions:
- **ORM**: Drizzle ORM chosen for type safety and performance
- **Schema**: Comprehensive schema supporting users, documents, courses, modules, lessons, quizzes, enrollments, and progress tracking
- **Migrations**: Database migrations managed through Drizzle Kit
- **Connection**: Neon serverless PostgreSQL for scalability and ease of deployment

## Key Components

### AI Processing Pipeline
The core feature is a 5-phase AI document processing system:
1. **Document Analysis**: Extract and analyze document content
2. **Content Analysis**: Identify learning objectives and structure
3. **Content Generation**: Create modules, lessons, and educational content
4. **Validation**: Ensure content quality and coherence
5. **Finalization**: Complete course structure and metadata

### User Management System
- **Production-Ready Authentication System**
  - Secure user registration with email and password
  - Password hashing using bcryptjs with salt rounds
  - JWT token-based authentication stored in httpOnly cookies
  - Session management with automatic token refresh
  - Protected API routes with authentication middleware
  - Logout functionality with cookie clearing
- Support for two user types: creators and learners
- User profiles with role-based access control
- Email verification support (field ready for implementation)

### Course Management
- Complete course creation workflow from document upload to published courses
- Module and lesson organization with hierarchical structure
- Quiz generation with multiple question types
- Progress tracking and enrollment management

### File Processing
- Multi-format document support (PDF, DOC, DOCX, TXT, MD)
- File validation and size limits (50MB)
- Secure file storage and content extraction

## Data Flow

1. **Document Upload**: Users upload documents through the file upload interface
2. **AI Processing**: Documents are processed through the 5-phase AI pipeline
3. **Course Generation**: AI generates structured courses with modules and lessons
4. **Content Review**: Creators can edit and refine generated content
5. **Publishing**: Courses are made available to learners
6. **Learning Experience**: Learners enroll, progress through content, and take quizzes
7. **Progress Tracking**: System tracks completion and performance metrics

## External Dependencies

### Core Dependencies
- **Google Gemini AI**: Primary AI service for content generation and analysis
- **Neon Database**: Serverless PostgreSQL hosting
- **Radix UI**: Headless UI components for accessibility and consistency
- **React Hook Form**: Form management with validation
- **TanStack Query**: Server state management and caching

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: JavaScript bundling for production

### File Processing
- **Multer**: File upload middleware
- **Various file parsers**: For extracting content from different document formats

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds the React application to static assets
- **Backend**: ESBuild bundles the Node.js server with external dependencies
- **Output**: Separate builds for frontend (static) and backend (Node.js)

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Gemini AI integration via `GEMINI_API_KEY`
- Development vs production configuration handling

### Production Readiness
- Static asset serving in production
- Proper error handling and logging
- Session management with connect-pg-simple
- File upload limits and validation
- CORS and security considerations

The architecture is designed for scalability with serverless database hosting, efficient AI processing pipelines, and modern frontend deployment patterns. The system can handle the complete lifecycle from document upload to course consumption while maintaining performance and user experience quality.