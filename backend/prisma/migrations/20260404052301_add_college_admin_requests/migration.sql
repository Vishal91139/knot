-- CreateEnum
CREATE TYPE "admin_request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "college_admin_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "college_id" UUID NOT NULL,
    "phone" VARCHAR(20),
    "designation" VARCHAR(120),
    "reason" TEXT,
    "status" "admin_request_status" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_admin_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "college_admin_requests_status_idx" ON "college_admin_requests"("status");

-- CreateIndex
CREATE INDEX "college_admin_requests_college_id_idx" ON "college_admin_requests"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_admin_requests_email_college_id_status_key" ON "college_admin_requests"("email", "college_id", "status");

-- AddForeignKey
ALTER TABLE "college_admin_requests" ADD CONSTRAINT "college_admin_requests_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_admin_requests" ADD CONSTRAINT "college_admin_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
