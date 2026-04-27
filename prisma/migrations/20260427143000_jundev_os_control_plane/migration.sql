-- CreateEnum
CREATE TYPE "ControlSystem" AS ENUM ('LIFE_HACK', 'JARVIS', 'TECH', 'MONEY', 'POREST');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('PLANNED', 'READY', 'RUNNING', 'BLOCKED', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('OPEN', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "system" "ControlSystem" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_reports" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "system" "ControlSystem" NOT NULL,
    "title" TEXT NOT NULL,
    "bodyMd" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "tags" TEXT[],
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_decisions" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "system" "ControlSystem" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'OPEN',
    "optionsJson" JSONB,
    "result" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_jobs" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "system" "ControlSystem" NOT NULL,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "OperationalStatus" NOT NULL DEFAULT 'PLANNED',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_runs" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "system" "ControlSystem" NOT NULL,
    "workflowKey" TEXT NOT NULL,
    "status" "OperationalStatus" NOT NULL DEFAULT 'RUNNING',
    "summary" TEXT,
    "metricsJson" JSONB,
    "logJson" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_events_ownerId_createdAt_idx" ON "system_events"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "system_events_ownerId_system_createdAt_idx" ON "system_events"("ownerId", "system", "createdAt");

-- CreateIndex
CREATE INDEX "system_events_ownerId_type_createdAt_idx" ON "system_events"("ownerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "system_reports_ownerId_system_updatedAt_idx" ON "system_reports"("ownerId", "system", "updatedAt");

-- CreateIndex
CREATE INDEX "system_reports_ownerId_createdAt_idx" ON "system_reports"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "system_decisions_ownerId_status_updatedAt_idx" ON "system_decisions"("ownerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "system_decisions_ownerId_system_status_idx" ON "system_decisions"("ownerId", "system", "status");

-- CreateIndex
CREATE INDEX "content_jobs_ownerId_status_updatedAt_idx" ON "content_jobs"("ownerId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "content_jobs_ownerId_system_status_idx" ON "content_jobs"("ownerId", "system", "status");

-- CreateIndex
CREATE INDEX "content_jobs_ownerId_dueAt_idx" ON "content_jobs"("ownerId", "dueAt");

-- CreateIndex
CREATE INDEX "workflow_runs_ownerId_workflowKey_createdAt_idx" ON "workflow_runs"("ownerId", "workflowKey", "createdAt");

-- CreateIndex
CREATE INDEX "workflow_runs_ownerId_system_status_idx" ON "workflow_runs"("ownerId", "system", "status");

-- AddForeignKey
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_reports" ADD CONSTRAINT "system_reports_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_decisions" ADD CONSTRAINT "system_decisions_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
