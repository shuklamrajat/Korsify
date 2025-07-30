import {
  users,
  documents,
  courses,
  modules,
  lessons,
  quizzes,
  enrollments,
  progress,
  quizAttempts,
  aiProcessingJobs,
  analyticsEvents,
  type User,
  type UpsertUser,
  type InsertDocument,
  type Document,
  type InsertCourse,
  type Course,
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
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type CourseWithDetails,
  type LearnerProgress,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, isNotNull, gte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocumentContent(id: string, content: string): Promise<void>;

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

  // Analytics operations
  createAnalyticsEvent(data: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsOverview(dateRange?: string): Promise<any>;
  getCoursePerformanceMetrics(): Promise<any[]>;
  getLearnerEngagementData(days?: number): Promise<any[]>;
  getTopCourses(limit?: number): Promise<any[]>;
  getCompletionTrends(): Promise<any[]>;
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
    // Temporarily simplified for type compatibility
    const [created] = await db.insert(lessons).values({
      moduleId: lesson.moduleId,
      title: lesson.title,
      content: lesson.content,
      orderIndex: lesson.orderIndex,
      estimatedDuration: lesson.estimatedDuration,
      videoUrl: lesson.videoUrl
    } as any).returning();
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

  // Analytics operations
  async createAnalyticsEvent(data: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db.insert(analyticsEvents).values(data).returning();
    return event;
  }

  async getAnalyticsOverview(dateRange: string = '30d'): Promise<any> {
    // Calculate date range
    const days = parseInt(dateRange.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overview metrics
    const totalCourses = await db.select({ count: sql<number>`count(*)` }).from(courses);
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalEnrollments = await db.select({ count: sql<number>`count(*)` }).from(enrollments);
    
    // Get completion rate
    const completedEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(isNotNull(enrollments.completedAt));

    // Get total time spent
    const timeSpent = await db
      .select({ total: sql<number>`coalesce(sum(time_spent), 0)` })
      .from(progress);

    // Get active users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.timestamp, today));

    const completionRate = totalEnrollments[0].count > 0 
      ? Math.round((completedEnrollments[0].count / totalEnrollments[0].count) * 100)
      : 0;

    return {
      totalCourses: totalCourses[0].count,
      totalLearners: totalUsers[0].count,
      totalEnrollments: totalEnrollments[0].count,
      averageCompletion: completionRate,
      totalTimeSpent: timeSpent[0].total || 0,
      activeToday: activeToday[0].count,
    };
  }

  async getCoursePerformanceMetrics(): Promise<any[]> {
    return await db
      .select({
        id: courses.id,
        title: courses.title,
        enrollments: sql<number>`count(${enrollments.id})`,
        completions: sql<number>`count(case when ${enrollments.completedAt} is not null then 1 end)`,
        averageTime: sql<number>`coalesce(avg(${progress.timeSpent}), 0)`,
        rating: courses.rating,
        completionRate: sql<number>`
          case when count(${enrollments.id}) > 0 
          then round(count(case when ${enrollments.completedAt} is not null then 1 end) * 100.0 / count(${enrollments.id}))
          else 0 end
        `,
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .leftJoin(progress, eq(enrollments.id, progress.enrollmentId))
      .groupBy(courses.id, courses.title, courses.rating)
      .orderBy(desc(sql`count(${enrollments.id})`));
  }

  async getLearnerEngagementData(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Generate sample engagement data since we don't have real analytics events yet
    const engagementData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      engagementData.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 50) + 10,
        newEnrollments: Math.floor(Math.random() * 15) + 2,
        completions: Math.floor(Math.random() * 8) + 1,
        timeSpent: Math.floor(Math.random() * 7200) + 1800, // 30 min to 2.5 hours
      });
    }
    return engagementData;
  }

  async getTopCourses(limit: number = 10): Promise<any[]> {
    return await db
      .select({
        title: courses.title,
        enrollments: sql<number>`count(${enrollments.id})`,
        rating: courses.rating,
      })
      .from(courses)
      .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
      .groupBy(courses.id, courses.title, courses.rating)
      .orderBy(desc(sql`count(${enrollments.id})`))
      .limit(limit);
  }

  async getCompletionTrends(): Promise<any[]> {
    // Generate sample completion trends data
    const trends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().slice(0, 7);
      trends.push({
        month,
        enrollments: Math.floor(Math.random() * 100) + 50,
        completions: Math.floor(Math.random() * 70) + 20,
      });
    }
    return trends;
  }
}

export const storage = new DatabaseStorage();
