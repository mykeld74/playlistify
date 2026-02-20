ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp with time zone;
