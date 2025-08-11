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
    // Skip auth middleware for auth routes - ensure the path check is correct
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    // Skip auth middleware for password reset
    if (req.path === '/auth/reset-password') {
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

  // Upload documents endpoint (supports multiple files and course linking)
  app.post('/api/documents/upload', upload.array('documents', 10), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const courseId = req.body.courseId;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const uploadedDocuments = [];
      
      // Upload all documents
      for (const file of files) {
        const documentData = {
          fileName: file.originalname,
          fileSize: file.size,
          fileType: path.extname(file.originalname).toLowerCase(),
          storageUrl: file.path,
          uploadedBy: req.user.id,
          status: 'completed' as const,
        };

        const validatedData = insertDocumentSchema.parse(documentData);
        const document = await storage.createDocument(validatedData);
        uploadedDocuments.push(document);
      }

      // If courseId provided, link documents to course
      if (courseId) {
        const documentIds = uploadedDocuments.map(doc => doc.id);
        await storage.addMultipleDocumentsToCourse(courseId, documentIds);
      }
      
      res.json({ 
        documents: uploadedDocuments,
        count: uploadedDocuments.length,
        courseId: courseId || null
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      res.status(500).json({ message: "Failed to upload documents" });
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
      
      // Fetch modules and lessons for each course to get counts
      const coursesWithCounts = await Promise.all(courses.map(async (course: any) => {
        const modules = await storage.getCourseModules(course.id);
        const modulesWithLessons = await Promise.all(modules.map(async (module: any) => {
          const lessons = await storage.getModuleLessons(module.id);
          return { ...module, lessons };
        }));
        return { ...course, modules: modulesWithLessons };
      }));
      
      res.json(coursesWithCounts);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Course search endpoint - Returns ALL published courses from ALL users platform-wide
  app.get('/api/courses/search', async (req: any, res) => {
    try {
      const { q } = req.query;
      const searchQuery = q ? String(q).toLowerCase() : '';
      
      // Get ALL published courses from ALL users on the platform (not filtered by current user)
      const courses = await storage.getPublishedCourses();
      
      // Filter based on search query
      let filteredCourses = courses;
      if (searchQuery) {
        filteredCourses = courses.filter((course: any) => 
          course.title.toLowerCase().includes(searchQuery) ||
          course.description?.toLowerCase().includes(searchQuery) ||
          course.targetAudience?.toLowerCase().includes(searchQuery) ||
          course.difficultyLevel?.toLowerCase().includes(searchQuery)
        );
      }

      // Fetch modules and lessons for each course to get counts
      const coursesWithCounts = await Promise.all(filteredCourses.map(async (course: any) => {
        const modules = await storage.getCourseModules(course.id);
        const modulesWithLessons = await Promise.all(modules.map(async (module: any) => {
          const lessons = await storage.getModuleLessons(module.id);
          return { ...module, lessons };
        }));
        return { ...course, modules: modulesWithLessons };
      }));

      res.json(coursesWithCounts);
    } catch (error) {
      console.error("Error searching courses:", error);
      res.status(500).json({ message: "Failed to search courses" });
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

  // Module routes
  app.post('/api/modules', async (req: any, res) => {
    try {
      const { courseId, title, description, orderIndex } = req.body;
      
      // Verify the course exists and user has permission
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      if (course.creatorId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this course' });
      }
      
      const module = await storage.createModule({
        courseId,
        title,
        description,
        orderIndex: orderIndex || 0
      });
      
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });
  
  app.patch('/api/modules/:id', async (req: any, res) => {
    try {
      const updated = await storage.updateModule(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });
  
  app.delete('/api/modules/:id', async (req: any, res) => {
    try {
      await storage.deleteModule(req.params.id);
      res.json({ message: 'Module deleted successfully' });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });
  
  // Lesson routes
  app.post('/api/lessons', async (req: any, res) => {
    try {
      const { moduleId, title, content, orderIndex } = req.body;
      
      const lesson = await storage.createLesson({
        moduleId,
        title,
        content,
        orderIndex: orderIndex || 0,
        sourceReferences: []
      });
      
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
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
  
  app.delete('/api/lessons/:id', async (req: any, res) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.json({ message: 'Lesson deleted successfully' });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
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

  // Unenroll from course
  app.delete('/api/enrollments/:courseId', async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.unenrollFromCourse(userId, courseId);

      // Update course enrollment count
      const course = await storage.getCourse(courseId);
      if (course && course.enrollmentCount !== null && course.enrollmentCount > 0) {
        await storage.updateCourse(courseId, {
          enrollmentCount: course.enrollmentCount - 1,
        });
      }

      res.json({ message: "Successfully unenrolled from course" });
    } catch (error) {
      console.error("Error unenrolling from course:", error);
      res.status(500).json({ message: "Failed to unenroll from course" });
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

  // Learning metrics endpoints
  app.get("/api/learner/metrics", async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const metrics = await storage.getLearningMetrics(req.user.id);
      
      // Get today's activity
      const today = new Date();
      const todayActivity = await storage.getDailyActivity(req.user.id, today);
      
      // Get enrolled courses count
      const enrollments = await storage.getUserEnrollments(req.user.id);
      const completedCourses = enrollments.filter(e => e.progress === 100).length;
      
      res.json({
        metrics,
        todayStudyTime: todayActivity?.studyTime || 0,
        enrolledCourses: enrollments.length,
        completedCourses
      });
    } catch (error) {
      console.error("Error fetching learning metrics:", error);
      res.status(500).json({ error: "Failed to fetch learning metrics" });
    }
  });

  // Track lesson progress with time
  app.post("/api/learner/track-progress", async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { lessonId, timeSpent } = req.body;
      
      if (!lessonId || typeof timeSpent !== 'number') {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Record the progress and update metrics
      await storage.recordLessonProgress(req.user.id, lessonId, Math.round(timeSpent));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking progress:", error);
      res.status(500).json({ error: "Failed to track progress" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/course/:courseId', async (req: any, res) => {
    try {
      const stats = await storage.getCourseStatistics(req.params.courseId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching course statistics:", error);
      res.status(500).json({ message: "Failed to fetch course statistics" });
    }
  });

  app.get('/api/analytics/creator', async (req: any, res) => {
    try {
      const analytics = await storage.getCreatorAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching creator analytics:", error);
      res.status(500).json({ message: "Failed to fetch creator analytics" });
    }
  });

  app.get('/api/analytics/learner', async (req: any, res) => {
    try {
      const analytics = await storage.getLearnerAnalytics(req.user.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching learner analytics:", error);
      res.status(500).json({ message: "Failed to fetch learner analytics" });
    }
  });

  // Search routes
  app.get('/api/courses/search', async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const courses = await storage.searchCourses(q);
      res.json(courses);
    } catch (error) {
      console.error("Error searching courses:", error);
      res.status(500).json({ message: "Failed to search courses" });
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

  // Create module
  app.post('/api/courses/:courseId/modules', async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const { title, description } = req.body;
      
      // Get the current modules to determine the order index
      const existingModules = await storage.getCourseModules(courseId);
      const orderIndex = existingModules.length;
      
      const moduleData = {
        courseId,
        title,
        description,
        orderIndex,
        estimatedDuration: 0
      };
      
      const module = await storage.createModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  // Update module
  app.patch('/api/modules/:moduleId', async (req: any, res) => {
    try {
      const { moduleId } = req.params;
      const updates = req.body;
      
      const updatedModule = await storage.updateModule(moduleId, updates);
      res.json(updatedModule);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  // Delete module
  app.delete('/api/modules/:moduleId', async (req: any, res) => {
    try {
      const { moduleId } = req.params;
      
      // Get all lessons in the module and delete them first
      const lessons = await storage.getModuleLessons(moduleId);
      for (const lesson of lessons) {
        await storage.deleteLesson(lesson.id);
      }
      
      await storage.deleteModule(moduleId);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Create lesson
  app.post('/api/modules/:moduleId/lessons', async (req: any, res) => {
    try {
      const { moduleId } = req.params;
      const { title, content } = req.body;
      
      // Get the current lessons to determine the order index
      const existingLessons = await storage.getModuleLessons(moduleId);
      const orderIndex = existingLessons.length;
      
      const lessonData = {
        moduleId,
        title,
        content,
        orderIndex,
        estimatedDuration: 5
      };
      
      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Update lesson
  app.patch('/api/lessons/:lessonId', async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      const updates = req.body;
      
      const updatedLesson = await storage.updateLesson(lessonId, updates);
      res.json(updatedLesson);
    } catch (error) {
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  // Delete lesson
  app.delete('/api/lessons/:lessonId', async (req: any, res) => {
    try {
      const { lessonId } = req.params;
      
      await storage.deleteLesson(lessonId);
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
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
