-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student', 'organizer', 'college_admin', 'super_admin');

-- CreateEnum
CREATE TYPE "organizer_type" AS ENUM ('club', 'department', 'faculty', 'admin');

-- CreateEnum
CREATE TYPE "event_category" AS ENUM ('cultural', 'technical', 'sports', 'academic', 'workshop', 'hackathon', 'other');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('incollege', 'intercollege');

-- CreateEnum
CREATE TYPE "event_mode" AS ENUM ('offline', 'online', 'hybrid');

-- CreateEnum
CREATE TYPE "event_status" AS ENUM ('draft', 'pending', 'reviewing', 'revision', 'approved', 'live', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('confirmed', 'waitlisted', 'cancelled', 'attended');

-- CreateEnum
CREATE TYPE "team_status" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "invite_status" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "scoring_type" AS ENUM ('points', 'time', 'rank', 'pass_fail');

-- CreateEnum
CREATE TYPE "participant_type" AS ENUM ('student', 'team');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('event_submitted', 'event_approved', 'event_rejected', 'event_revision', 'event_cancelled', 'event_reminder', 'registration_confirmed', 'waitlist_promoted', 'team_invite', 'leaderboard_updated', 'certificate_ready', 'announcement', 'system');

-- CreateEnum
CREATE TYPE "speaker_role" AS ENUM ('speaker', 'judge', 'mentor', 'guest');

-- CreateEnum
CREATE TYPE "verification_method" AS ENUM ('email_otp', 'id_card', 'manual');

-- CreateEnum
CREATE TYPE "id_card_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "colleges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(50),
    "email_domain" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "website_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "college_email" VARCHAR(255),
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'student',
    "college_id" UUID,
    "roll_number" VARCHAR(50),
    "branch" VARCHAR(100),
    "year_of_study" INTEGER,
    "avatar_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_method" "verification_method",
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_email" VARCHAR(255) NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_card_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "id_card_url" TEXT NOT NULL,
    "status" "id_card_status" NOT NULL DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "rejection_note" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "manual_verified_by" UUID,

    CONSTRAINT "id_card_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "org_name" VARCHAR(150) NOT NULL,
    "org_type" "organizer_type" NOT NULL DEFAULT 'club',
    "logo_url" TEXT,
    "description" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizer_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "short_description" VARCHAR(300) NOT NULL,
    "long_description" TEXT NOT NULL,
    "category" "event_category" NOT NULL,
    "event_type" "event_type" NOT NULL DEFAULT 'incollege',
    "mode" "event_mode" NOT NULL DEFAULT 'offline',
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "registration_deadline" TIMESTAMP(3) NOT NULL,
    "venue_name" VARCHAR(200),
    "venue_address" TEXT,
    "online_link" TEXT,
    "max_capacity" INTEGER NOT NULL,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "is_team_event" BOOLEAN NOT NULL DEFAULT false,
    "min_team_size" INTEGER,
    "max_team_size" INTEGER,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "entry_fee" DECIMAL(10,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "waitlist_enabled" BOOLEAN NOT NULL DEFAULT false,
    "has_multi_rounds" BOOLEAN NOT NULL DEFAULT false,
    "banner_url" TEXT,
    "poster_url" TEXT,
    "document_url" TEXT,
    "tags" TEXT[],
    "status" "event_status" NOT NULL DEFAULT 'draft',
    "rejection_reason" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "description" TEXT,
    "location" VARCHAR(200),

    CONSTRAINT "event_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_speakers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "designation" VARCHAR(200),
    "bio" TEXT,
    "photo_url" TEXT,
    "role" "speaker_role" NOT NULL DEFAULT 'speaker',

    CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "leader_id" UUID NOT NULL,
    "team_name" VARCHAR(100) NOT NULL,
    "status" "team_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "team_id" UUID,
    "status" "registration_status" NOT NULL DEFAULT 'confirmed',
    "waitlist_position" INTEGER,
    "qr_code" TEXT NOT NULL,
    "payment_id" VARCHAR(200),
    "amount_paid" DECIMAL(10,2),
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "checked_in_at" TIMESTAMP(3),
    "certificate_url" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "invite_status" "invite_status" NOT NULL DEFAULT 'pending',
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "round_number" INTEGER NOT NULL,
    "round_name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "scoring_type" "scoring_type" NOT NULL DEFAULT 'points',
    "scheduled_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "tiebreaker_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "round_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "participant_type" "participant_type" NOT NULL,
    "score" DECIMAL(10,2),
    "time_taken" INTEGER,
    "rank_in_round" INTEGER,
    "is_eliminated" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "notification_type" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "related_event_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "followed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "organization_rating" INTEGER,
    "content_rating" INTEGER,
    "comments" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_gallery" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" VARCHAR(300),
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "icon_url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points_required" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "badge_id" UUID NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colleges_short_name_key" ON "colleges"("short_name");

-- CreateIndex
CREATE UNIQUE INDEX "colleges_email_domain_key" ON "colleges"("email_domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_college_email_key" ON "users"("college_email");

-- CreateIndex
CREATE UNIQUE INDEX "id_card_verifications_student_id_college_id_key" ON "id_card_verifications"("student_id", "college_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizers_user_id_key" ON "organizers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_event_id_team_name_key" ON "teams"("event_id", "team_name");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_qr_code_key" ON "registrations"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_event_id_student_id_key" ON "registrations"("event_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_student_id_key" ON "team_members"("team_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_event_id_round_number_key" ON "rounds"("event_id", "round_number");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_round_id_participant_id_participant_typ_key" ON "leaderboard_entries"("round_id", "participant_id", "participant_type");

-- CreateIndex
CREATE UNIQUE INDEX "follows_student_id_organizer_id_key" ON "follows"("student_id", "organizer_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_event_id_student_id_key" ON "feedback"("event_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "badges_name_key" ON "badges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_badges_student_id_badge_id_key" ON "student_badges"("student_id", "badge_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_card_verifications" ADD CONSTRAINT "id_card_verifications_manual_verified_by_fkey" FOREIGN KEY ("manual_verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_card_verifications" ADD CONSTRAINT "id_card_verifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_card_verifications" ADD CONSTRAINT "id_card_verifications_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_card_verifications" ADD CONSTRAINT "id_card_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizers" ADD CONSTRAINT "organizers_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_schedule" ADD CONSTRAINT "event_schedule_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_event_id_fkey" FOREIGN KEY ("related_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_gallery" ADD CONSTRAINT "event_gallery_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
