/*
  Warnings:

  - The values [faculty,admin] on the enum `organizer_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "organizer_type_new" AS ENUM ('club', 'department');
ALTER TABLE "public"."organizers" ALTER COLUMN "org_type" DROP DEFAULT;
ALTER TABLE "organizers" ALTER COLUMN "org_type" TYPE "organizer_type_new" USING ("org_type"::text::"organizer_type_new");
ALTER TYPE "organizer_type" RENAME TO "organizer_type_old";
ALTER TYPE "organizer_type_new" RENAME TO "organizer_type";
DROP TYPE "public"."organizer_type_old";
ALTER TABLE "organizers" ALTER COLUMN "org_type" SET DEFAULT 'club';
COMMIT;

-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'faculty';
