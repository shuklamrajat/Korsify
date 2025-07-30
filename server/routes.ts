import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { documentProcessor } from "./services/documentProcessor";
import { insertDocumentSchema, insertCourseSchema, insertEnrollmentSchema } from "@shared/schema";

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
  // Mock authentication middleware for demo
  const mockAuth = (req: any, res: any, next: any) => {
    // In production, use proper authentication
    req.user = {
      id: 'demo-user-id',
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      userType: 'creator',
    };
    next();
  };

  app.use('/api', mockAuth);

  // User routes
  app.get('/api/user', async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        // Create demo user if not exists
        const newUser = await storage.upsertUser({
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          userType: req.user.userType,
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      
      // Get all documents uploaded by the course creator
      const documents = await storage.getUserDocuments(course.creatorId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching course documents:", error);
      res.status(500).json({ message: "Failed to fetch course documents" });
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
