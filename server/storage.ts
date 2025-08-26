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
  learningMetrics,
  dailyActivity,
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
  type LearningMetrics,
  type DailyActivity,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lt, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: any): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  updateUserRole(id: string, role: 'creator' | 'learner'): Promise<void>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  getUserByLinkedInId(linkedinId: string): Promise<User | undefined>;
  updateUserGoogleId(userId: string, googleId: string): Promise<void>;
  createGoogleUser(email: string, googleId: string, firstName: string | null, lastName: string | null): Promise<User>;

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
  getQuizByLessonId(lessonId: string): Promise<Quiz | undefined>;
  getQuizByModuleId(moduleId: string): Promise<Quiz | undefined>;
  getModuleQuizzes(moduleId: string): Promise<Quiz[]>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz>;
  deleteQuiz(id: string): Promise<void>;

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

  // Learning metrics operations
  getLearningMetrics(userId: string): Promise<LearningMetrics | undefined>;
  updateLearningMetrics(userId: string, studyTime: number): Promise<void>;
  getDailyActivity(userId: string, date: Date): Promise<DailyActivity | undefined>;
  recordLessonProgress(userId: string, lessonId: string, timeSpent: number): Promise<void>;
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

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      currentRole: userData.currentRole || null,
      emailVerified: userData.emailVerified || false,
      authProvider: userData.authProvider || 'local'
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
      return user;
    } catch (error: any) {
      console.error("Database error in getUserByGoogleId:", error);
      throw error;
    }
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async getUserByLinkedInId(linkedinId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.linkedinId, linkedinId));
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

  async updateUserGoogleId(userId: string, googleId: string): Promise<void> {
    await db.update(users)
      .set({ googleId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createGoogleUser(email: string, googleId: string, firstName: string | null, lastName: string | null): Promise<User> {
    const [user] = await db.insert(users).values({
      email,
      googleId,
      firstName,
      lastName,
      emailVerified: true, // Google accounts are pre-verified
      currentRole: null, // Will be selected after login
      passwordHash: null, // No password for OAuth users
      authProvider: 'google'
    }).returning();
    return user;
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
    // Returns ALL published courses from ALL users on the entire platform
    // No user filtering - this is for the global course catalog
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

  // Analytics and Course Statistics
  async getCourseStatistics(courseId: string): Promise<{
    totalModules: number;
    totalLessons: number;
    estimatedDuration: number;
    enrollmentCount: number;
    completionRate: number;
    averageProgress: number;
  }> {
    const courseModules = await this.getCourseModules(courseId);
    let totalLessons = 0;
    let estimatedDuration = 0;

    for (const module of courseModules) {
      const lessons = await this.getModuleLessons(module.id);
      totalLessons += lessons.length;
      
      // Calculate duration based on word count (125 words per minute for educational content)
      for (const lesson of lessons) {
        const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 0;
        const readingTime = Math.ceil(wordCount / 125); // 125 words per minute
        estimatedDuration += readingTime;
      }
    }

    // Get enrollment statistics
    const courseEnrollments = await db.select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
    
    const enrollmentCount = courseEnrollments.length;
    const completedEnrollments = courseEnrollments.filter(e => e.completedAt).length;
    const completionRate = enrollmentCount > 0 ? (completedEnrollments / enrollmentCount) * 100 : 0;

    // Calculate average progress
    let totalProgress = 0;
    for (const enrollment of courseEnrollments) {
      totalProgress += enrollment.progress || 0;
    }
    const averageProgress = enrollmentCount > 0 ? totalProgress / enrollmentCount : 0;

    return {
      totalModules: courseModules.length,
      totalLessons,
      estimatedDuration,
      enrollmentCount,
      completionRate,
      averageProgress
    };
  }

  async getCreatorAnalytics(creatorId: string): Promise<{
    totalCourses: number;
    totalLearners: number;
    totalLessons: number;
    averageRating: number;
    completionRate: number;
    engagementRate: number;
    recentActivity: Array<{
      date: string;
      enrollments: number;
      completions: number;
    }>;
  }> {
    const creatorCourses = await this.getUserCourses(creatorId);
    let totalLearners = 0;
    let totalLessons = 0;
    let totalRating = 0;
    let totalCompletions = 0;
    let totalEnrollments = 0;

    for (const course of creatorCourses) {
      const stats = await this.getCourseStatistics(course.id);
      totalLessons += stats.totalLessons;
      totalLearners += stats.enrollmentCount;
      totalRating += course.rating || 0;
      totalEnrollments += stats.enrollmentCount;
      totalCompletions += Math.floor((stats.completionRate / 100) * stats.enrollmentCount);
    }

    const averageRating = creatorCourses.length > 0 ? totalRating / creatorCourses.length : 0;
    const completionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;
    const engagementRate = totalLearners > 0 ? Math.min((totalCompletions / totalLearners) * 100, 100) : 0;

    // Get recent activity (last 7 days)
    const recentActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEnrollments = await db.select()
        .from(enrollments)
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(
          eq(courses.creatorId, creatorId),
          gte(enrollments.enrolledAt, date),
          lt(enrollments.enrolledAt, nextDate)
        ));

      const dayCompletions = dayEnrollments.filter(e => 
        e.enrollments.completedAt && 
        e.enrollments.completedAt >= date && 
        e.enrollments.completedAt < nextDate
      ).length;

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        enrollments: dayEnrollments.length,
        completions: dayCompletions
      });
    }

    return {
      totalCourses: creatorCourses.length,
      totalLearners,
      totalLessons,
      averageRating,
      completionRate,
      engagementRate,
      recentActivity
    };
  }

  async getLearnerAnalytics(learnerId: string): Promise<{
    totalEnrolledCourses: number;
    completedCourses: number;
    totalLearningTime: number;
    averageProgress: number;
    streakDays: number;
    achievements: number;
    recentActivity: Array<{
      date: string;
      minutesLearned: number;
      lessonsCompleted: number;
    }>;
  }> {
    const learnerEnrollments = await this.getUserEnrollments(learnerId);
    const completedCourses = learnerEnrollments.filter(e => e.enrollment.completedAt).length;
    
    let totalLearningTime = 0;
    let totalProgress = 0;

    for (const enrollment of learnerEnrollments) {
      totalProgress += enrollment.progressPercentage;
      
      // Calculate learning time from completed lessons
      const progressRecords = await this.getEnrollmentProgress(enrollment.enrollment.id);
      for (const record of progressRecords) {
        totalLearningTime += (record.timeSpent || 0) / 60; // Convert to minutes
      }
    }

    const averageProgress = learnerEnrollments.length > 0 
      ? totalProgress / learnerEnrollments.length 
      : 0;

    // Calculate streak (simplified - consecutive days with activity)
    const recentProgress = await db.select()
      .from(progress)
      .innerJoin(enrollments, eq(progress.enrollmentId, enrollments.id))
      .where(eq(enrollments.learnerId, learnerId))
      .orderBy(desc(progress.completedAt));

    let streakDays = 0;
    if (recentProgress.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        
        const hasActivity = recentProgress.some(p => {
          if (!p.progress.completedAt) return false;
          const activityDate = new Date(p.progress.completedAt);
          activityDate.setHours(0, 0, 0, 0);
          return activityDate.getTime() === checkDate.getTime();
        });
        
        if (hasActivity) {
          streakDays++;
        } else if (i > 0) {
          break;
        }
      }
    }

    // Calculate achievements (simple count based on milestones)
    let achievements = 0;
    if (completedCourses >= 1) achievements++;
    if (completedCourses >= 5) achievements++;
    if (completedCourses >= 10) achievements++;
    if (streakDays >= 7) achievements++;
    if (streakDays >= 30) achievements++;
    if (totalLearningTime >= 600) achievements++; // 10 hours

    // Get recent activity (last 7 days)
    const recentActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayProgress = await db.select()
        .from(progress)
        .innerJoin(enrollments, eq(progress.enrollmentId, enrollments.id))
        .where(and(
          eq(enrollments.learnerId, learnerId),
          gte(progress.completedAt, date),
          lt(progress.completedAt, nextDate)
        ));

      const minutesLearned = dayProgress.reduce((sum, p) => 
        sum + ((p.progress.timeSpent || 0) / 60), 0
      );

      recentActivity.push({
        date: date.toISOString().split('T')[0],
        minutesLearned: Math.round(minutesLearned),
        lessonsCompleted: dayProgress.filter(p => p.progress.completed).length
      });
    }

    return {
      totalEnrolledCourses: learnerEnrollments.length,
      completedCourses,
      totalLearningTime: Math.round(totalLearningTime),
      averageProgress,
      streakDays,
      achievements,
      recentActivity
    };
  }

  async searchCourses(query: string): Promise<Course[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return db.select()
      .from(courses)
      .where(and(
        eq(courses.status, 'published'),
        or(
          sql`LOWER(${courses.title}) LIKE ${searchTerm}`,
          sql`LOWER(${courses.description}) LIKE ${searchTerm}`
        )
      ))
      .orderBy(desc(courses.enrollmentCount), desc(courses.rating));
  }

  // Course Template operations
  async createCourseTemplate(template: InsertCourseTemplate): Promise<CourseTemplate> {
    // Ensure tags is a proper array
    const templateData = {
      ...template,
      tags: template.tags || []
    };
    const [created] = await db.insert(courseTemplates).values(templateData).returning();
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
    // Ensure attachments and sourceReferences are proper arrays
    const lessonData = {
      ...lesson,
      attachments: lesson.attachments || [],
      sourceReferences: lesson.sourceReferences || []
    };
    const [created] = await db.insert(lessons).values(lessonData).returning();
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

  async getQuizByLessonId(lessonId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId));
    return quiz;
  }

  async getQuizByModuleId(moduleId: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes)
      .where(and(
        eq(quizzes.moduleId, moduleId),
        isNull(quizzes.lessonId)
      ));
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    const [updated] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return updated;
  }

  async getModuleQuizzes(moduleId: string): Promise<Quiz[]> {
    // Get all quizzes for this module (including lesson quizzes)
    return db.select().from(quizzes).where(eq(quizzes.moduleId, moduleId));
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
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

  async unenrollFromCourse(learnerId: string, courseId: string): Promise<void> {
    await db.delete(enrollments)
      .where(and(
        eq(enrollments.learnerId, learnerId),
        eq(enrollments.courseId, courseId)
      ));
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

  // Learning metrics operations
  async getLearningMetrics(userId: string): Promise<LearningMetrics | undefined> {
    let [metrics] = await db.select().from(learningMetrics).where(eq(learningMetrics.userId, userId));
    
    // If no metrics exist, create initial metrics for the user
    if (!metrics) {
      const [newMetrics] = await db.insert(learningMetrics).values({
        userId,
        totalStudyTime: 0,
        weeklyStudyTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        streakStartDate: null,
        weekStartDate: new Date(),
        dailyGoal: 30
      }).returning();
      metrics = newMetrics;
    }
    
    return metrics;
  }

  async updateLearningMetrics(userId: string, studyTimeMinutes: number): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get or create metrics
    let metrics = await this.getLearningMetrics(userId);
    if (!metrics) return;
    
    // Check if we need to reset weekly study time (new week started)
    const weekStart = metrics.weekStartDate ? new Date(metrics.weekStartDate) : today;
    const daysSinceWeekStart = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    const shouldResetWeek = daysSinceWeekStart >= 7;
    
    // Calculate streak
    let newStreak = metrics.currentStreak || 0;
    let streakStart = metrics.streakStartDate;
    
    if (metrics.lastActiveDate) {
      const lastActive = new Date(metrics.lastActiveDate);
      const daysSinceLastActive = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActive === 0) {
        // Same day, just update time
      } else if (daysSinceLastActive === 1) {
        // Consecutive day, increment streak
        newStreak += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
        streakStart = today;
      }
    } else {
      // First time activity
      newStreak = 1;
      streakStart = today;
    }
    
    // Update metrics
    await db.update(learningMetrics)
      .set({
        totalStudyTime: sql`${learningMetrics.totalStudyTime} + ${studyTimeMinutes}`,
        weeklyStudyTime: shouldResetWeek ? studyTimeMinutes : sql`${learningMetrics.weeklyStudyTime} + ${studyTimeMinutes}`,
        currentStreak: newStreak,
        longestStreak: sql`GREATEST(${learningMetrics.longestStreak}, ${newStreak})`,
        lastActiveDate: today,
        streakStartDate: streakStart,
        weekStartDate: shouldResetWeek ? today : metrics.weekStartDate,
        updatedAt: now
      })
      .where(eq(learningMetrics.userId, userId));
    
    // Update or create daily activity
    await this.updateDailyActivity(userId, today, studyTimeMinutes);
  }

  async getDailyActivity(userId: string, date: Date): Promise<DailyActivity | undefined> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    const [activity] = await db.select()
      .from(dailyActivity)
      .where(and(
        eq(dailyActivity.userId, userId),
        gte(dailyActivity.date, startOfDay),
        lt(dailyActivity.date, endOfDay)
      ));
    
    return activity;
  }

  private async updateDailyActivity(userId: string, date: Date, studyTimeMinutes: number): Promise<void> {
    const existing = await this.getDailyActivity(userId, date);
    
    if (existing) {
      // Update existing activity
      await db.update(dailyActivity)
        .set({
          studyTime: sql`${dailyActivity.studyTime} + ${studyTimeMinutes}`,
          goalMet: sql`${dailyActivity.studyTime} + ${studyTimeMinutes} >= 30`
        })
        .where(eq(dailyActivity.id, existing.id));
    } else {
      // Create new activity
      await db.insert(dailyActivity).values({
        userId,
        date,
        studyTime: studyTimeMinutes,
        lessonsCompleted: 0,
        coursesAccessed: [],
        goalMet: studyTimeMinutes >= 30
      });
    }
  }

  async recordLessonProgress(userId: string, lessonId: string, timeSpentMinutes: number): Promise<void> {
    // Update learning metrics with study time
    await this.updateLearningMetrics(userId, timeSpentMinutes);
    
    // Also update the progress record with time spent
    const enrollment = await db.select()
      .from(enrollments)
      .innerJoin(lessons, eq(lessons.id, lessonId))
      .innerJoin(modules, eq(modules.id, lessons.moduleId))
      .where(and(
        eq(enrollments.learnerId, userId),
        eq(modules.courseId, enrollments.courseId)
      ))
      .limit(1);
    
    if (enrollment.length > 0) {
      // Update or create progress record
      const existingProgress = await db.select()
        .from(progress)
        .where(and(
          eq(progress.enrollmentId, enrollment[0].enrollments.id),
          eq(progress.lessonId, lessonId)
        ))
        .limit(1);
      
      if (existingProgress.length > 0) {
        await db.update(progress)
          .set({
            timeSpent: sql`COALESCE(${progress.timeSpent}, 0) + ${timeSpentMinutes}`
          })
          .where(eq(progress.id, existingProgress[0].id));
      }
    }
  }
}

export const storage = new DatabaseStorage();
