-- DropForeignKey
ALTER TABLE "college_admin_requests" DROP CONSTRAINT "college_admin_requests_college_id_fkey";

-- DropIndex
DROP INDEX "college_admin_requests_email_college_id_status_key";

-- AlterTable
ALTER TABLE "college_admin_requests" ADD COLUMN     "requested_college_city" VARCHAR(100),
ADD COLUMN     "requested_college_email_domain" VARCHAR(100),
ADD COLUMN     "requested_college_logo_url" TEXT,
ADD COLUMN     "requested_college_name" VARCHAR(200),
ADD COLUMN     "requested_college_short_name" VARCHAR(50),
ADD COLUMN     "requested_college_state" VARCHAR(100),
ADD COLUMN     "requested_college_website_url" TEXT,
ALTER COLUMN "college_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "college_admin_requests_requested_college_email_domain_idx" ON "college_admin_requests"("requested_college_email_domain");

-- AddForeignKey
ALTER TABLE "college_admin_requests" ADD CONSTRAINT "college_admin_requests_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
