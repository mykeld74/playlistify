ALTER TABLE "verification" ADD COLUMN "updatedAt" timestamp with time zone NOT NULL DEFAULT now();
