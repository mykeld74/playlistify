-- Run this once in your database (e.g. Neon SQL editor) if verification table
-- is missing createdAt/updatedAt and db:migrate isn't applying 0002/0003.
-- PostgreSQL 11+: IF NOT EXISTS avoids errors if columns already exist.

ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone NOT NULL DEFAULT now();
