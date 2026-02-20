CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"expiresAt" timestamp with time zone,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" RENAME TO "session";
--> statement-breakpoint
ALTER TABLE "users" RENAME TO "user";
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "users_spotify_id_unique";
--> statement-breakpoint
ALTER TABLE "blocked_artists" DROP CONSTRAINT "blocked_artists_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expiresAt" timestamp with time zone;
--> statement-breakpoint
UPDATE "session" SET "expiresAt" = "expires_at";
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expiresAt" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ipAddress" text;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "userAgent" text;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "userId" text;
--> statement-breakpoint
UPDATE "session" SET "userId" = "user_id";
--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "userId" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "name" text;
--> statement-breakpoint
UPDATE "user" SET "name" = COALESCE("display_name", 'User');
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" text;
--> statement-breakpoint
UPDATE "user" SET "email" = "id" || '@migrated.local';
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "image" text;
--> statement-breakpoint
UPDATE "user" SET "image" = "image_url";
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp with time zone;
--> statement-breakpoint
UPDATE "user" SET "createdAt" = "created_at";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "createdAt" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updatedAt" timestamp with time zone;
--> statement-breakpoint
UPDATE "user" SET "updatedAt" = "created_at";
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updatedAt" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blocked_artists" ADD CONSTRAINT "blocked_artists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "user_id";
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "access_token";
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "refresh_token";
--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "expires_at";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "spotify_id";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "display_name";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "image_url";
--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "created_at";
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");
