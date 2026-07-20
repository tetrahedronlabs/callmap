BEGIN;
--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "departments_legacy_department_id_key";--> statement-breakpoint
ALTER TABLE "departments" DROP COLUMN "legacy_department_id";--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "legacy_department_id";--> statement-breakpoint
ALTER TABLE "locations" DROP COLUMN "legacy_department_id";--> statement-breakpoint
ALTER TABLE "records" DROP COLUMN "legacy_department_id";--> statement-breakpoint
COMMIT;
