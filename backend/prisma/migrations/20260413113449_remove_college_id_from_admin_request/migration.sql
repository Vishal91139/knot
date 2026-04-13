/*
  Warnings:

  - You are about to drop the column `college_id` on the `college_admin_requests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "college_admin_requests" DROP CONSTRAINT "college_admin_requests_college_id_fkey";

-- DropIndex
DROP INDEX "college_admin_requests_college_id_idx";

-- AlterTable
ALTER TABLE "college_admin_requests" DROP COLUMN "college_id";
