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

// Source Reference type for citations
export interface SourceReference {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber?: number;
  startOffset: number;
  endOffset: number;
  text: string;
  context?: string;
}

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
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  currentRole: varchar("current_role", { enum: ['creator', 'learner'] }),
  emailVerified: boolean("email_verified").default(false),
  // OAuth provider fields
  googleId: varchar("google_id").unique(),
  appleId: varchar("apple_id").unique(),
  linkedinId: varchar("linkedin_id").unique(),
  authProvider: varchar("auth_provider", { enum: ['local', 'google', 'apple', 'linkedin'] }).default('local'),
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

// Course Templates table
export const courseTemplates = pgTable("course_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull(), // e.g., 'business', 'technology', 'education', 'health'
  tags: jsonb("tags").$type<string[]>().default([]),
  thumbnailUrl: varchar("thumbnail_url"),
  difficultyLevel: varchar("difficulty_level", { enum: ['beginner', 'intermediate', 'advanced'] }).default('beginner'),
  estimatedDuration: integer("estimated_duration"), // in minutes
  structure: jsonb("structure").notNull(), // Course outline structure
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull(),
  templateId: varchar("template_id"), // Link to course template if created from template
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

// Course Documents junction table for many-to-many relationship
export const courseDocuments = pgTable("course_documents", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  courseId: varchar("course_id", { length: 255 }).notNull(),
  documentId: varchar("document_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  sourceReferences: jsonb("source_references").$type<SourceReference[]>().default([]),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertCourseTemplateSchema = createInsertSchema(courseTemplates).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCourseDocumentSchema = createInsertSchema(courseDocuments).omit({ id: true, createdAt: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true, createdAt: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrolledAt: true });
export const insertProgressSchema = createInsertSchema(progress).omit({ id: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const insertAiProcessingJobSchema = createInsertSchema(aiProcessingJobs).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertCourseTemplate = z.infer<typeof insertCourseTemplateSchema>;
export type CourseTemplate = typeof courseTemplates.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourseDocument = z.infer<typeof insertCourseDocumentSchema>;
export type CourseDocument = typeof courseDocuments.$inferSelect;
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
