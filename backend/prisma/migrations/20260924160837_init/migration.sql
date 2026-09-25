-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ENG', 'SNT', 'TRD');

-- CreateEnum
CREATE TYPE "Line" AS ENUM ('UP', 'DN', 'BOTH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('scheduled', 'unscheduled', 'quarantined');

-- CreateEnum
CREATE TYPE "TriggerSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateTable
CREATE TABLE "BlockSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fromStation" TEXT NOT NULL,
    "toStation" TEXT NOT NULL,
    "chainageStartKm" DOUBLE PRECISION NOT NULL,
    "chainageEndKm" DOUBLE PRECISION NOT NULL,
    "division" TEXT NOT NULL,
    "maxWindowMin" INTEGER NOT NULL,

    CONSTRAINT "BlockSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Defect" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "sectionId" TEXT NOT NULL,
    "chainageKm" DOUBLE PRECISION NOT NULL,
    "line" "Line" NOT NULL,
    "category" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "detectedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "oheMastNumber" TEXT,

    CONSTRAINT "Defect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShapFactor" (
    "id" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ShapFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "sectionId" TEXT NOT NULL,
    "chainageKm" DOUBLE PRECISION NOT NULL,
    "line" "Line" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "p80DurationMin" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'unscheduled',
    "defectIds" TEXT[],
    "bindingConstraint" TEXT,
    "oheMastNumber" TEXT,
    "statutory" BOOLEAN NOT NULL,
    "dueDate" TIMESTAMP(3),
    "replanFailures" INTEGER NOT NULL DEFAULT 0,
    "blockId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledBlock" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "departments" "Department"[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduledBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanVersion" (
    "id" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "safetyWeight" DOUBLE PRECISION NOT NULL,
    "diffFromPrevious" TEXT[],

    CONSTRAINT "PlanVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RePlanTrigger" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "severity" "TriggerSeverity" NOT NULL,

    CONSTRAINT "RePlanTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "text" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "safetyWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlanState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Defect_sectionId_idx" ON "Defect"("sectionId");

-- CreateIndex
CREATE INDEX "ShapFactor_taskId_idx" ON "ShapFactor"("taskId");

-- CreateIndex
CREATE INDEX "Task_sectionId_idx" ON "Task"("sectionId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_blockId_idx" ON "Task"("blockId");

-- CreateIndex
CREATE INDEX "ScheduledBlock_sectionId_idx" ON "ScheduledBlock"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanVersion_versionNumber_key" ON "PlanVersion"("versionNumber");

-- AddForeignKey
ALTER TABLE "Defect" ADD CONSTRAINT "Defect_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BlockSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShapFactor" ADD CONSTRAINT "ShapFactor_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BlockSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "ScheduledBlock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledBlock" ADD CONSTRAINT "ScheduledBlock_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BlockSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
