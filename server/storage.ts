import {
  users,
  documents,
  courseTemplates,
  courses,
  courseDocuments,
  modules,
  lessons,
  quizzes,
  enrollments,
  progress,
  quizAttempts,
  aiProcessingJobs,
  type User,
  type UpsertUser,
  type InsertDocument,
  type Document,
  type InsertCourseTemplate,
  type CourseTemplate,
  type InsertCourse,
  type Course,
  type InsertCourseDocument,
  type CourseDocument,
  type InsertModule,
  type Module,
  type InsertLesson,
  type Lesson,
  type InsertQuiz,
  type Quiz,
  type InsertEnrollment,
  type Enrollment,
  type InsertProgress,
  type Progress,
  type InsertQuizAttempt,
  type QuizAttempt,
  type InsertAiProcessingJob,
  type AiProcessingJob,
  type CourseWithDetails,
  type LearnerProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(email: string, passwordHash: string, firstName?: string, lastName?: string): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  updateUserRole(id: string, role: 'creator' | 'learner'): Promise<void>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocumentContent(id: string, content: string): Promise<void>;
  updateDocument(id: string, updates: Partial<Document>): Promise<void>;
  
  // Course Document operations
  addDocumentToCourse(courseId: string, documentId: string): Promise<CourseDocument>;
  removeDocumentFromCourse(courseId: string, documentId: string): Promise<void>;
  getCourseDocuments(courseId: string): Promise<Document[]>;
  addMultipleDocumentsToCourse(courseId: string, documentIds: string[]): Promise<CourseDocument[]>;

  // Course Template operations
  createCourseTemplate(template: InsertCourseTemplate): Promise<CourseTemplate>;
  getCourseTemplate(id: string): Promise<CourseTemplate | undefined>;
  getCourseTemplates(): Promise<CourseTemplate[]>;
  getCourseTemplatesByCategory(category: string): Promise<CourseTemplate[]>;
  updateCourseTemplate(id: string, updates: Partial<CourseTemplate>): Promise<CourseTemplate>;
  deleteCourseTemplate(id: string): Promise<void>;

  // Course operations
  createCourse(course: InsertCourse): Promise<Course>;
  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithDetails(id: string): Promise<CourseWithDetails | undefined>;
  getUserCourses(userId: string): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  // Module operations
  createModule(module: InsertModule): Promise<Module>;
  getCourseModules(courseId: string): Promise<Module[]>;
  updateModule(id: string, updates: Partial<Module>): Promise<Module>;
  deleteModule(id: string): Promise<void>;

  // Lesson operations
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  getModuleLessons(moduleId: string): Promise<Lesson[]>;
  updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;

  // Quiz operations
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getLessonQuiz(lessonId: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz>;

  // Enrollment operations
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getUserEnrollments(userId: string): Promise<LearnerProgress[]>;
  getEnrollment(learnerId: string, courseId: string): Promise<Enrollment | undefined>;
  updateEnrollmentProgress(id: string, progress: number): Promise<void>;

  // Progress operations
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(enrollmentId: string, lessonId: string, completed: boolean, timeSpent?: number): Promise<void>;
  getEnrollmentProgress(enrollmentId: string): Promise<Progress[]>;

  // Quiz attempt operations
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getUserQuizAttempts(learnerId: string, quizId: string): Promise<QuizAttempt[]>;

  // AI processing operations
  createAiProcessingJob(job: InsertAiProcessingJob): Promise<AiProcessingJob>;
  updateAiProcessingJob(id: string, updates: Partial<AiProcessingJob>): Promise<AiProcessingJob>;
  getAiProcessingJob(id: string): Promise<AiProcessingJob | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(email: string, passwordHash: string, firstName?: string, lastName?: string): Promise<User> {
    const [user] = await db.insert(users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      currentRole: null, // Role will be selected after first login
      emailVerified: false
    }).returning();
    return user;
  }

  async updateUserRole(id: string, role: 'creator' | 'learner'): Promise<void> {
    await db.update(users)
      .set({ currentRole: role, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.uploadedBy, userId)).orderBy(desc(documents.createdAt));
  }

  async updateDocumentContent(id: string, content: string): Promise<void> {
    await db.update(documents).set({ processedContent: content }).where(eq(documents.id, id));
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    await db.update(documents).set(updates).where(eq(documents.id, id));
  }

  // Course Document operations
  async addDocumentToCourse(courseId: string, documentId: string): Promise<CourseDocument> {
    const [created] = await db.insert(courseDocuments).values({
      courseId,
      documentId
    }).returning();
    return created;
  }

  async removeDocumentFromCourse(courseId: string, documentId: string): Promise<void> {
    await db.delete(courseDocuments)
      .where(and(
        eq(courseDocuments.courseId, courseId),
        eq(courseDocuments.documentId, documentId)
      ));
  }

  async getCourseDocuments(courseId: string): Promise<Document[]> {
    const courseDocumentLinks = await db
      .select()
      .from(courseDocuments)
      .innerJoin(documents, eq(courseDocuments.documentId, documents.id))
      .where(eq(courseDocuments.courseId, courseId))
      .orderBy(desc(courseDocuments.createdAt));

    return courseDocumentLinks.map(({ documents }) => documents);
  }

  async addMultipleDocumentsToCourse(courseId: string, documentIds: string[]): Promise<CourseDocument[]> {
    if (documentIds.length === 0) return [];
    
    const values = documentIds.map(documentId => ({
      courseId,
      documentId
    }));

    const created = await db.insert(courseDocuments).values(values).returning();
    return created;
  }

  // Course operations
  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseWithDetails(id: string): Promise<CourseWithDetails | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const creator = await this.getUser(course.creatorId);
    if (!creator) return undefined;

    const courseModules = await this.getCourseModules(id);
    const modulesWithLessons = await Promise.all(
      courseModules.map(async (module) => ({
        ...module,
        lessons: await this.getModuleLessons(module.id),
      }))
    );

    return {
      ...course,
      creator,
      modules: modulesWithLessons,
      enrollmentCount: course.enrollmentCount || 0,
      averageRating: course.rating || 0,
    };
  }

  async getUserCourses(userId: string): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.creatorId, userId)).orderBy(desc(courses.createdAt));
  }

  async getPublishedCourses(): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.status, 'published')).orderBy(desc(courses.createdAt));
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const [updated] = await db
      .update(courses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return updated;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Course Template operations
  async createCourseTemplate(template: InsertCourseTemplate): Promise<CourseTemplate> {
    const [created] = await db.insert(courseTemplates).values(template).returning();
    return created;
  }

  async getCourseTemplate(id: string): Promise<CourseTemplate | undefined> {
    const [template] = await db.select().from(courseTemplates).where(eq(courseTemplates.id, id));
    return template;
  }

  async getCourseTemplates(): Promise<CourseTemplate[]> {
    return db.select().from(courseTemplates).where(eq(courseTemplates.isActive, true)).orderBy(courseTemplates.name);
  }

  async getCourseTemplatesByCategory(category: string): Promise<CourseTemplate[]> {
    return db.select().from(courseTemplates)
      .where(and(eq(courseTemplates.category, category), eq(courseTemplates.isActive, true)))
      .orderBy(courseTemplates.name);
  }

  async updateCourseTemplate(id: string, updates: Partial<CourseTemplate>): Promise<CourseTemplate> {
    const [updated] = await db.update(courseTemplates).set(updates).where(eq(courseTemplates.id, id)).returning();
    return updated;
  }

  async deleteCourseTemplate(id: string): Promise<void> {
    await db.delete(courseTemplates).where(eq(courseTemplates.id, id));
  }

  // Module operations
  async createModule(module: InsertModule): Promise<Module> {
    const [created] = await db.insert(modules).values(module).returning();
    return created;
  }

  async getCourseModules(courseId: string): Promise<Module[]> {
    return db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(modules.orderIndex);
  }

  async updateModule(id: string, updates: Partial<Module>): Promise<Module> {
    const [updated] = await db.update(modules).set(updates).where(eq(modules.id, id)).returning();
    return updated;
  }

  async deleteModule(id: string): Promise<void> {
    await db.delete(modules).where(eq(modules.id, id));
  }

  // Lesson operations
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values({
      moduleId: lesson.moduleId,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.orderIndex,
      estimatedDuration: lesson.estimatedDuration,
      videoUrl: lesson.videoUrl,
      attachments: lesson.attachments || []
    }).returning();
    return created;
  }

  async getModuleLessons(moduleId: string): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(lessons.orderIndex);
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    const [updated] = await db.update(lessons).set(updates).where(eq(lessons.id, id)).returning();
    return updated;
  }

  async deleteLesson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Quiz operations
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [created] = await db.insert(quizzes).values(quiz).returning();
    return created;
  }

  async getLessonQuiz(lessonId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const [updated] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return updated;
  }

  // Enrollment operations
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    return created;
  }

  async getUserEnrollments(userId: string): Promise<LearnerProgress[]> {
    const userEnrollments = await db
      .select()
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.learnerId, userId))
      .orderBy(desc(enrollments.enrolledAt));

    return Promise.all(
      userEnrollments.map(async ({ enrollments: enrollment, courses: course }) => {
        const courseModules = await this.getCourseModules(course.id);
        const totalLessons = await Promise.all(
          courseModules.map(async (module) => {
            const lessons = await this.getModuleLessons(module.id);
            return lessons.length;
          })
        ).then(counts => counts.reduce((a, b) => a + b, 0));

        const enrollmentProgress = await this.getEnrollmentProgress(enrollment.id);
        const completedLessons = enrollmentProgress.filter(p => p.completed).length;

        return {
          enrollment,
          course,
          progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          completedLessons,
          totalLessons,
        };
      })
    );
  }

  async getEnrollment(learnerId: string, courseId: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.learnerId, learnerId), eq(enrollments.courseId, courseId)));
    return enrollment;
  }

  async updateEnrollmentProgress(id: string, progressPercentage: number): Promise<void> {
    await db.update(enrollments).set({ progress: progressPercentage }).where(eq(enrollments.id, id));
  }

  // Progress operations
  async createProgress(progressData: InsertProgress): Promise<Progress> {
    const [created] = await db.insert(progress).values(progressData).returning();
    return created;
  }

  async updateProgress(enrollmentId: string, lessonId: string, completed: boolean, timeSpent?: number): Promise<void> {
    const [existing] = await db
      .select()
      .from(progress)
      .where(and(eq(progress.enrollmentId, enrollmentId), eq(progress.lessonId, lessonId)));

    if (existing) {
      await db
        .update(progress)
        .set({
          completed,
          completedAt: completed ? new Date() : null,
          timeSpent: timeSpent ? (existing.timeSpent || 0) + timeSpent : existing.timeSpent,
        })
        .where(eq(progress.id, existing.id));
    } else {
      await db.insert(progress).values({
        enrollmentId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : undefined,
        timeSpent: timeSpent || 0,
      });
    }
  }

  async getEnrollmentProgress(enrollmentId: string): Promise<Progress[]> {
    return db.select().from(progress).where(eq(progress.enrollmentId, enrollmentId));
  }

  // Quiz attempt operations
  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [created] = await db.insert(quizAttempts).values(attempt).returning();
    return created;
  }

  async getUserQuizAttempts(learnerId: string, quizId: string): Promise<QuizAttempt[]> {
    return db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.learnerId, learnerId), eq(quizAttempts.quizId, quizId)))
      .orderBy(desc(quizAttempts.completedAt));
  }

  // AI processing operations
  async createAiProcessingJob(job: InsertAiProcessingJob): Promise<AiProcessingJob> {
    const [created] = await db.insert(aiProcessingJobs).values(job).returning();
    return created;
  }

  async updateAiProcessingJob(id: string, updates: Partial<AiProcessingJob>): Promise<AiProcessingJob> {
    const [updated] = await db
      .update(aiProcessingJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiProcessingJobs.id, id))
      .returning();
    return updated;
  }

  async getAiProcessingJob(id: string): Promise<AiProcessingJob | undefined> {
    const [job] = await db.select().from(aiProcessingJobs).where(eq(aiProcessingJobs.id, id));
    return job;
  }
}

export const storage = new DatabaseStorage();
