CREATE TABLE "departments" (
	"department_id" smallint PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"record_count" bigint NOT NULL,
	"last_updated" timestamp with time zone NOT NULL,
	"days_parsed" bigint NOT NULL,
	"logo" text NOT NULL,
	"slug" text,
	CONSTRAINT "departments_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"file_id" uuid PRIMARY KEY NOT NULL,
	"file_name" text,
	"department_id" smallint
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"parsed_location" text PRIMARY KEY NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"location" text NOT NULL,
	"count" integer,
	"department_id" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "records" (
	"case_number" text,
	"incident" text,
	"location" text,
	"record_id" uuid PRIMARY KEY NOT NULL,
	"date_reported" text,
	"date_occurred" text,
	"time_occurred" text,
	"summary" text,
	"disposition" text,
	"parsed_location" text,
	"parsed_date_reported" date,
	"parsed_date_occurred" date,
	"parsed_time_occurred" time,
	"department_id" smallint NOT NULL,
	"file_id" uuid
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("department_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "public"."files"("file_id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "files_department_id_idx" ON "files" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "locations_department_id_idx" ON "locations" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "records_department_id_idx" ON "records" USING btree ("department_id");