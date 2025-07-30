import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ['creator', 'learner'] }).notNull().default('learner'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: varchar("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type").notNull(),
  storageUrl: varchar("storage_url").notNull(),
  processedContent: text("processed_content"),
  uploadedBy: varchar("uploaded_by").notNull(),
  status: varchar("status", { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull(),
  documentId: varchar("document_id"),
  status: varchar("status", { enum: ['draft', 'processing', 'published'] }).notNull().default('draft'),
  language: varchar("language").default('en'),
  targetAudience: varchar("target_audience"),
  contentFocus: varchar("content_focus"),
  difficultyLevel: varchar("difficulty_level", { enum: ['beginner', 'intermediate', 'advanced'] }).default('beginner'),
  estimatedDuration: integer("estimated_duration"), // in minutes
  thumbnailUrl: varchar("thumbnail_url"),
  rating: real("rating").default(0),
  enrollmentCount: integer("enrollment_count").default(0),
  completionRate: real("completion_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Modules table
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  estimatedDuration: integer("estimated_duration"), // in minutes
  videoUrl: varchar("video_url"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id"),
  moduleId: varchar("module_id"),
  title: varchar("title").notNull(),
  questions: jsonb("questions").notNull(),
  passingScore: integer("passing_score").default(70),
  maxAttempts: integer("max_attempts").default(3),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  learnerId: varchar("learner_id").notNull(),
  courseId: varchar("course_id").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: real("progress").default(0), // percentage
  currentModuleId: varchar("current_module_id"),
  currentLessonId: varchar("current_lesson_id"),
});

// Progress tracking table
export const progress = pgTable("progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent").default(0), // in seconds
  engagementScore: real("engagement_score").default(0), // 0-100
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull(),
  learnerId: varchar("learner_id").notNull(),
  score: integer("score").notNull(),
  answers: jsonb("answers").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// AI processing jobs table
export const aiProcessingJobs = pgTable("ai_processing_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull(),
  status: varchar("status", { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  phase: varchar("phase", { enum: ['document_analysis', 'content_analysis', 'content_generation', 'validation', 'finalization'] }),
  progress: integer("progress").default(0), // 0-100
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics events table for detailed tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  courseId: varchar("course_id"),
  lessonId: varchar("lesson_id"),
  eventType: varchar("event_type").notNull(), // view, start, complete, pause, resume, quiz_attempt, etc.
  eventData: jsonb("event_data"), // Additional event-specific data
  sessionId: varchar("session_id"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Daily analytics aggregates for performance
export const dailyAnalytics = pgTable("daily_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  courseId: varchar("course_id"),
  totalViews: integer("total_views").default(0),
  uniqueViews: integer("unique_views").default(0),
  totalTimeSpent: integer("total_time_spent").default(0), // in seconds
  completions: integer("completions").default(0),
  enrollments: integer("enrollments").default(0),
  averageEngagement: real("average_engagement").default(0),
  bounceRate: real("bounce_rate").default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const insertAiProcessingJobSchema = createInsertSchema(aiProcessingJobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export const insertDailyAnalyticsSchema = createInsertSchema(dailyAnalytics).omit({ id: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Module = typeof modules.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertAiProcessingJob = z.infer<typeof insertAiProcessingJobSchema>;
export type AiProcessingJob = typeof aiProcessingJobs.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertDailyAnalytics = z.infer<typeof insertDailyAnalyticsSchema>;
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect;

// Extended types for API responses
export type CourseWithDetails = Course & {
  creator: User;
  modules: (Module & {
    lessons: Lesson[];
  })[];
  enrollmentCount: number;
  averageRating: number;
};

export type LearnerProgress = {
  enrollment: Enrollment;
  course: Course;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  currentLesson?: Lesson;
};
