-- Reset schema
DROP SCHEMA IF EXISTS "public" CASCADE;
CREATE SCHEMA "public";

-- Extensions (optional)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enums
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');
CREATE TYPE "ResumeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ARCHIVED');
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "NoteEdgeStatus" AS ENUM ('CANDIDATE', 'CONFIRMED', 'REJECTED');
CREATE TYPE "NoteEdgeOrigin" AS ENUM ('AUTO', 'MANUAL');
CREATE TYPE "BlogPlatform" AS ENUM ('NAVER', 'TISTORY', 'VELOG', 'CUSTOM');
CREATE TYPE "FeedbackTargetType" AS ENUM ('PORTFOLIO', 'RESUME', 'NOTE', 'BLOG');

-- Auth tables
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Portfolio tables
CREATE TABLE "portfolio_settings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "publicSlug" TEXT NOT NULL,
    "displayName" TEXT,
    "headline" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "layoutJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "portfolio_links" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "portfolio_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "bulletsJson" JSONB,
    "metricsJson" JSONB,
    "techTags" TEXT[] NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "school" TEXT NOT NULL,
    "major" TEXT,
    "degree" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "name" TEXT NOT NULL,
    "category" TEXT,
    "level" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "contentMd" TEXT NOT NULL,
    "techStack" TEXT[] NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isOngoing" BOOLEAN NOT NULL DEFAULT false,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "highlightsJson" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_links" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "project_links_pkey" PRIMARY KEY ("id")
);

-- Resume tables
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "ResumeStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "targetCompany" TEXT,
    "targetRole" TEXT,
    "level" TEXT,
    "summaryMd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resume_items" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "overrideBulletsJson" JSONB,
    "overrideMetricsJson" JSONB,
    "overrideTechTags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_items_pkey" PRIMARY KEY ("id")
);

-- Notes tables
CREATE TABLE "notebooks" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notebooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "notebookId" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "contentMd" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT[] NOT NULL,
    "lastLinkedAt" TIMESTAMP(3),
    "linkMetaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "note_edges" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "status" "NoteEdgeStatus" NOT NULL DEFAULT 'CANDIDATE',
    "origin" "NoteEdgeOrigin" NOT NULL DEFAULT 'AUTO',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "note_embeddings" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_embeddings_pkey" PRIMARY KEY ("id")
);

-- Blog tables
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "title" TEXT NOT NULL,
    "contentMd" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT[] NOT NULL,
    "lintReportJson" JSONB,
    "lastLintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_integrations" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "platform" "BlogPlatform" NOT NULL,
    "name" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "credentialsJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_external_posts" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "externalId" TEXT,
    "externalUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncMetaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_external_posts_pkey" PRIMARY KEY ("id")
);

-- Feedback tables
CREATE TABLE "feedback_requests" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "targetType" "FeedbackTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "contextJson" JSONB,
    "optionsJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feedback_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "evidenceJson" JSONB,
    "pointerJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_items_pkey" PRIMARY KEY ("id")
);

-- Indexes and constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

CREATE UNIQUE INDEX "portfolio_settings_ownerId_key" ON "portfolio_settings"("ownerId");
CREATE UNIQUE INDEX "portfolio_settings_publicSlug_key" ON "portfolio_settings"("publicSlug");

CREATE INDEX "portfolio_links_settingsId_order_idx" ON "portfolio_links"("settingsId", "order");

CREATE INDEX "experiences_ownerId_visibility_order_idx" ON "experiences"("ownerId", "visibility", "order");

CREATE INDEX "educations_ownerId_visibility_order_idx" ON "educations"("ownerId", "visibility", "order");

CREATE UNIQUE INDEX "skills_ownerId_name_key" ON "skills"("ownerId", "name");
CREATE INDEX "skills_ownerId_visibility_category_order_idx" ON "skills"("ownerId", "visibility", "category", "order");

CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");
CREATE INDEX "projects_ownerId_visibility_order_idx" ON "projects"("ownerId", "visibility", "order");

CREATE INDEX "project_links_projectId_order_idx" ON "project_links"("projectId", "order");

CREATE INDEX "resumes_ownerId_status_updatedAt_idx" ON "resumes"("ownerId", "status", "updatedAt");
CREATE INDEX "resumes_targetCompany_targetRole_idx" ON "resumes"("targetCompany", "targetRole");

CREATE UNIQUE INDEX "resume_items_resumeId_experienceId_key" ON "resume_items"("resumeId", "experienceId");
CREATE INDEX "resume_items_resumeId_sortOrder_idx" ON "resume_items"("resumeId", "sortOrder");

CREATE UNIQUE INDEX "notebooks_ownerId_name_key" ON "notebooks"("ownerId", "name");
CREATE INDEX "notebooks_ownerId_idx" ON "notebooks"("ownerId");

CREATE INDEX "notes_ownerId_notebookId_visibility_updatedAt_idx" ON "notes"("ownerId", "notebookId", "visibility", "updatedAt");
CREATE INDEX "notes_title_idx" ON "notes"("title");

CREATE UNIQUE INDEX "note_edges_fromId_toId_relationType_key" ON "note_edges"("fromId", "toId", "relationType");
CREATE INDEX "note_edges_fromId_status_idx" ON "note_edges"("fromId", "status");
CREATE INDEX "note_edges_toId_status_idx" ON "note_edges"("toId", "status");

CREATE INDEX "note_embeddings_noteId_chunkIndex_idx" ON "note_embeddings"("noteId", "chunkIndex");

CREATE INDEX "blog_posts_ownerId_status_updatedAt_idx" ON "blog_posts"("ownerId", "status", "updatedAt");
CREATE INDEX "blog_posts_title_idx" ON "blog_posts"("title");

CREATE UNIQUE INDEX "blog_integrations_ownerId_platform_name_key" ON "blog_integrations"("ownerId", "platform", "name");
CREATE INDEX "blog_integrations_ownerId_platform_isEnabled_idx" ON "blog_integrations"("ownerId", "platform", "isEnabled");

CREATE UNIQUE INDEX "blog_external_posts_integrationId_externalId_key" ON "blog_external_posts"("integrationId", "externalId");
CREATE INDEX "blog_external_posts_blogPostId_idx" ON "blog_external_posts"("blogPostId");

CREATE INDEX "feedback_requests_ownerId_targetType_createdAt_idx" ON "feedback_requests"("ownerId", "targetType", "createdAt");
CREATE INDEX "feedback_items_requestId_severity_idx" ON "feedback_items"("requestId", "severity");

-- Foreign Keys
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_settings" ADD CONSTRAINT "portfolio_settings_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "portfolio_links" ADD CONSTRAINT "portfolio_links_settingsId_fkey"
    FOREIGN KEY ("settingsId") REFERENCES "portfolio_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "experiences" ADD CONSTRAINT "experiences_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "educations" ADD CONSTRAINT "educations_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skills" ADD CONSTRAINT "skills_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "projects" ADD CONSTRAINT "projects_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_links" ADD CONSTRAINT "project_links_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resumes" ADD CONSTRAINT "resumes_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resume_items" ADD CONSTRAINT "resume_items_resumeId_fkey"
    FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resume_items" ADD CONSTRAINT "resume_items_experienceId_fkey"
    FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notes" ADD CONSTRAINT "notes_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notes" ADD CONSTRAINT "notes_notebookId_fkey"
    FOREIGN KEY ("notebookId") REFERENCES "notebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "note_edges" ADD CONSTRAINT "note_edges_fromId_fkey"
    FOREIGN KEY ("fromId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "note_edges" ADD CONSTRAINT "note_edges_toId_fkey"
    FOREIGN KEY ("toId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "note_embeddings" ADD CONSTRAINT "note_embeddings_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_integrations" ADD CONSTRAINT "blog_integrations_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_external_posts" ADD CONSTRAINT "blog_external_posts_blogPostId_fkey"
    FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_external_posts" ADD CONSTRAINT "blog_external_posts_integrationId_fkey"
    FOREIGN KEY ("integrationId") REFERENCES "blog_integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "feedback_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 체크 제약: 대표 노출은 공개여야 함
ALTER TABLE "projects" ADD CONSTRAINT "projects_featured_public_check"
    CHECK ("isFeatured" = false OR "visibility" = 'PUBLIC');

ALTER TABLE "experiences" ADD CONSTRAINT "experiences_featured_public_check"
    CHECK ("isFeatured" = false OR "visibility" = 'PUBLIC');
