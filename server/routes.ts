import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { documentProcessor } from "./services/documentProcessor";
import { templateGenerator } from "./services/templateGenerator";
import { insertDocumentSchema, insertCourseSchema, insertCourseTemplateSchema, insertEnrollmentSchema } from "@shared/schema";
import { authenticate, AuthRequest } from "./auth";
import { setupAuthRoutes } from "./authRoutes";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and MD files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuthRoutes(app);

  // Apply authentication middleware to protected API routes
  // Note: auth routes themselves don't need this middleware
  app.use('/api', (req, res, next) => {
    // Skip auth middleware for auth routes
    if (req.path.startsWith('/api/auth/')) {
      return next();
    }
    // Apply authentication for all other API routes
    return authenticate(req as AuthRequest, res, next);
  });

  // User routes
  app.get('/api/user', async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Process document for course
  app.post('/api/documents/process-for-course', upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const courseId = req.body.courseId;
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      // Save document
      const documentData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        storageUrl: req.file.path,
        uploadedBy: req.user.id,
        status: 'processing' as const,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      // Start AI processing for the course
      documentProcessor.processDocumentAsync(
        document.id,
        req.user.id,
        courseId,
        undefined, // jobId will be created internally
        {}
      ).catch(error => {
        console.error("Document processing error:", error);
        storage.updateDocument(document.id, { status: 'failed' });
      });

      res.json({ 
        message: 'Document uploaded and processing started',
        documentId: document.id 
      });
    } catch (error) {
      console.error("Error processing document for course:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  // Document routes
  app.post('/api/documents', upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const documentData = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        storageUrl: req.file.path,
        uploadedBy: req.user.id,
        status: 'completed' as const,
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await storage.createDocument(validatedData);
      
      res.json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/documents', async (req: any, res) => {
    try {
      const documents = await storage.getUserDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Course generation routes
  app.post('/api/courses/generate', async (req: any, res) => {
    try {
      const { documentId, options = {} } = req.body;
      
      if (!documentId) {
        return res.status(400).json({ message: 'Document ID is required' });
      }

      // Start async processing
      const courseId = await documentProcessor.processDocument(
        documentId,
        req.user.id,
        options
      );

      res.json({ courseId, status: 'completed' });
    } catch (error) {
      console.error("Error generating course:", error);
      res.status(500).json({ message: "Failed to generate course" });
    }
  });

  // Async course generation with progress tracking
  app.post('/api/courses/generate-async', async (req: any, res) => {
    try {
      const { courseId, documentIds, options = {} } = req.body;
      
      if (!courseId || !documentIds || documentIds.length === 0) {
        return res.status(400).json({ message: 'Course ID and document IDs are required' });
      }

      // Create processing job and start async processing
      const job = await storage.createAiProcessingJob({
        documentId: documentIds[0], // For now, use first document
        status: 'pending',
        phase: 'document_analysis',
        progress: 0,
      });

      // Start processing in background
      documentProcessor.processDocumentAsync(
        documentIds[0],
        req.user.id,
        courseId,
        job.id,
        options
      ).catch(error => {
        console.error("Background processing error:", error);
        storage.updateAiProcessingJob(job.id, {
          status: 'failed',
          error: error.message
        });
      });

      res.json({ jobId: job.id, status: 'processing' });
    } catch (error) {
      console.error("Error starting course generation:", error);
      res.status(500).json({ message: "Failed to start course generation" });
    }
  });

  // Get processing job status
  app.get('/api/processing-jobs/:id', async (req: any, res) => {
    try {
      const job = await storage.getAiProcessingJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ message: "Failed to fetch job status" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req: any, res) => {
    try {
      const { type = 'my' } = req.query;
      
      let courses;
      if (type === 'published') {
        courses = await storage.getPublishedCourses();
      } else {
        courses = await storage.getUserCourses(req.user.id);
      }
      
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', async (req: any, res) => {
    try {
      const courseData = insertCourseSchema.parse({
        title: req.body.title || "New Course",
        description: req.body.description || "",
        creatorId: req.user.id,
        status: 'draft'
      });
      
      const course = await storage.createCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.get('/api/courses/:id', async (req: any, res) => {
    try {
      const course = await storage.getCourseWithDetails(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Get documents for a specific course
  app.get('/api/courses/:id/documents', async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Get documents linked to this specific course
      const documents = await storage.getCourseDocuments(req.params.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching course documents:", error);
      res.status(500).json({ message: "Failed to fetch course documents" });
    }
  });

  // Add documents to a course
  app.post('/api/courses/:id/documents', async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this course' });
      }

      const { documentIds } = req.body;
      if (!documentIds || !Array.isArray(documentIds)) {
        return res.status(400).json({ message: 'Document IDs are required' });
      }

      const courseDocuments = await storage.addMultipleDocumentsToCourse(req.params.id, documentIds);
      res.json(courseDocuments);
    } catch (error) {
      console.error("Error adding documents to course:", error);
      res.status(500).json({ message: "Failed to add documents to course" });
    }
  });

  // Remove a document from a course
  app.delete('/api/courses/:courseId/documents/:documentId', async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this course' });
      }

      await storage.removeDocumentFromCourse(req.params.courseId, req.params.documentId);
      res.json({ message: 'Document removed from course' });
    } catch (error) {
      console.error("Error removing document from course:", error);
      res.status(500).json({ message: "Failed to remove document from course" });
    }
  });

  app.patch('/api/courses/:id', async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this course' });
      }

      const updated = await storage.updateCourse(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/courses/:id', async (req: any, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this course' });
      }

      await storage.deleteCourse(req.params.id);
      res.json({ message: 'Course deleted successfully' });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Course Template routes
  app.get('/api/templates', async (req: any, res) => {
    try {
      const { category } = req.query;
      const templates = category 
        ? await storage.getCourseTemplatesByCategory(category)
        : await storage.getCourseTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get('/api/templates/:id', async (req: any, res) => {
    try {
      const template = await storage.getCourseTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post('/api/templates/:id/generate', async (req: any, res) => {
    try {
      const template = await storage.getCourseTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      const { title, targetAudience, difficultyLevel } = req.body;

      // Generate course structure from template
      const courseStructure = await templateGenerator.generateCourseFromTemplate(template, {
        title,
        targetAudience,
        difficultyLevel
      });

      // Create the course
      const courseData = {
        title: title || template.name,
        description: template.description,
        creatorId: req.user.id,
        templateId: template.id,
        targetAudience: targetAudience || 'General learners',
        difficultyLevel: difficultyLevel || template.difficultyLevel,
        estimatedDuration: template.estimatedDuration,
        status: 'draft' as const
      };

      const course = await storage.createCourse(courseData);

      // Create modules and lessons
      for (const moduleData of courseStructure.modules) {
        const module = await storage.createModule({
          courseId: course.id,
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleData.orderIndex,
          estimatedDuration: moduleData.estimatedDuration
        });

        for (const lessonData of moduleData.lessons) {
          await storage.createLesson({
            moduleId: module.id,
            title: lessonData.title,
            content: lessonData.content,
            orderIndex: lessonData.orderIndex,
            estimatedDuration: lessonData.estimatedDuration
          });
        }
      }

      res.json({ course, message: 'Course generated successfully from template' });
    } catch (error) {
      console.error("Error generating course from template:", error);
      res.status(500).json({ message: "Failed to generate course from template" });
    }
  });

  app.post('/api/templates/custom', async (req: any, res) => {
    try {
      const { title, description, category, difficultyLevel, targetAudience, estimatedDuration } = req.body;

      // Generate custom course structure
      const courseStructure = await templateGenerator.createCustomTemplate({
        title,
        description,
        category,
        difficultyLevel,
        targetAudience,
        estimatedDuration
      });

      // Create the course directly
      const courseData = {
        title,
        description,
        creatorId: req.user.id,
        targetAudience,
        difficultyLevel,
        estimatedDuration,
        status: 'draft' as const
      };

      const course = await storage.createCourse(courseData);

      // Create modules and lessons
      for (const moduleData of courseStructure.modules) {
        const module = await storage.createModule({
          courseId: course.id,
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleData.orderIndex,
          estimatedDuration: moduleData.estimatedDuration
        });

        for (const lessonData of moduleData.lessons) {
          await storage.createLesson({
            moduleId: module.id,
            title: lessonData.title,
            content: lessonData.content,
            orderIndex: lessonData.orderIndex,
            estimatedDuration: lessonData.estimatedDuration
          });
        }
      }

      res.json({ course, message: 'Custom course generated successfully' });
    } catch (error) {
      console.error("Error generating custom course:", error);
      res.status(500).json({ message: "Failed to generate custom course" });
    }
  });

  // Enrollment routes
  app.post('/api/enrollments', async (req: any, res) => {
    try {
      const { courseId } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      // Check if already enrolled
      const existing = await storage.getEnrollment(req.user.id, courseId);
      if (existing) {
        return res.status(400).json({ message: 'Already enrolled in this course' });
      }

      const enrollmentData = {
        learnerId: req.user.id,
        courseId,
      };

      const validatedData = insertEnrollmentSchema.parse(enrollmentData);
      const enrollment = await storage.createEnrollment(validatedData);
      
      res.json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to enroll in course" });
    }
  });

  app.get('/api/enrollments', async (req: any, res) => {
    try {
      const enrollments = await storage.getUserEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Progress routes
  app.post('/api/progress', async (req: any, res) => {
    try {
      const { enrollmentId, lessonId, completed, timeSpent } = req.body;
      
      await storage.updateProgress(enrollmentId, lessonId, completed, timeSpent);
      
      res.json({ message: 'Progress updated successfully' });
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Module and lesson routes
  app.get('/api/modules/:id/lessons', async (req: any, res) => {
    try {
      const lessons = await storage.getModuleLessons(req.params.id);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.patch('/api/lessons/:id', async (req: any, res) => {
    try {
      const updated = await storage.updateLesson(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
