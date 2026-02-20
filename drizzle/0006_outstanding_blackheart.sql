ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;