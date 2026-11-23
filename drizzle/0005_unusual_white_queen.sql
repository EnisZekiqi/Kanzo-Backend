ALTER TYPE "public"."project_status" ADD VALUE 'PENDING_DELETION';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deletion_at" timestamp with time zone;