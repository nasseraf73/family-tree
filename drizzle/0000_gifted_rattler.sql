CREATE TABLE "branch_reviewers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"root_person_id" bigint NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "merge_requests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"primary_person_id" bigint NOT NULL,
	"duplicate_person_id" bigint NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"requested_by_user_id" bigint,
	"reviewed_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"father_name" varchar(100),
	"grand_father_name" varchar(100),
	"family_name" varchar(100),
	"gender" varchar(10) NOT NULL,
	"is_alive" boolean DEFAULT true NOT NULL,
	"birth_date" date,
	"birth_year" integer,
	"death_date" date,
	"burial_place" varchar(255),
	"photo_url" text,
	"biography" text,
	"created_by_user_id" bigint,
	"claimed_by_user_id" bigint,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "persons_claimed_by_user_id_unique" UNIQUE("claimed_by_user_id")
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"person_id" bigint NOT NULL,
	"related_person_id" bigint NOT NULL,
	"relationship_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_by_user_id" bigint,
	"verified_by_user_id" bigint,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"password_hash" varchar(255),
	"role" varchar(20) DEFAULT 'USER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "branch_reviewers" ADD CONSTRAINT "branch_reviewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_reviewers" ADD CONSTRAINT "branch_reviewers_root_person_id_persons_id_fk" FOREIGN KEY ("root_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_primary_person_id_persons_id_fk" FOREIGN KEY ("primary_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_duplicate_person_id_persons_id_fk" FOREIGN KEY ("duplicate_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merge_requests" ADD CONSTRAINT "merge_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_related_person_id_persons_id_fk" FOREIGN KEY ("related_person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;