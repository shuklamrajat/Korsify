CREATE TABLE "ai_processing_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"phase" varchar,
	"progress" integer DEFAULT 0,
	"result" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_documents" (
	"id" varchar(255) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar(255) NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"thumbnail_url" varchar,
	"difficulty_level" varchar DEFAULT 'beginner',
	"estimated_duration" integer,
	"structure" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"creator_id" varchar NOT NULL,
	"template_id" varchar,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"language" varchar DEFAULT 'en',
	"target_audience" varchar,
	"content_focus" varchar,
	"difficulty_level" varchar DEFAULT 'beginner',
	"estimated_duration" integer,
	"thumbnail_url" varchar,
	"rating" real DEFAULT 0,
	"enrollment_count" integer DEFAULT 0,
	"completion_rate" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" varchar NOT NULL,
	"storage_url" varchar NOT NULL,
	"processed_content" text,
	"uploaded_by" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"progress" real DEFAULT 0,
	"current_module_id" varchar,
	"current_lesson_id" varchar
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"content" text NOT NULL,
	"order_index" integer NOT NULL,
	"estimated_duration" integer,
	"video_url" varchar,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"source_references" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"estimated_duration" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" varchar NOT NULL,
	"lesson_id" varchar NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" varchar NOT NULL,
	"learner_id" varchar NOT NULL,
	"score" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"attempt_number" integer NOT NULL,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" varchar,
	"module_id" varchar,
	"title" varchar NOT NULL,
	"questions" jsonb NOT NULL,
	"passing_score" integer DEFAULT 70,
	"max_attempts" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"current_role" varchar,
	"email_verified" boolean DEFAULT false,
	"google_id" varchar,
	"apple_id" varchar,
	"linkedin_id" varchar,
	"auth_provider" varchar DEFAULT 'local',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_apple_id_unique" UNIQUE("apple_id"),
	CONSTRAINT "users_linkedin_id_unique" UNIQUE("linkedin_id")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");