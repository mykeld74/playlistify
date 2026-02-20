/**
 * Creates all app tables from scratch.
 * Use when db:migrate doesn't create tables (e.g. wrong DB or migration state).
 *
 *   pnpm run db:create-tables
 *
 * Requires DATABASE_URL in .env.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set. Set it in .env');
	process.exit(1);
}

const sql = neon(url);

try {
	await sql`CREATE TABLE IF NOT EXISTS "user" (
		"id" text PRIMARY KEY NOT NULL,
		"name" text NOT NULL,
		"email" text NOT NULL,
		"emailVerified" boolean NOT NULL DEFAULT false,
		"image" text,
		"createdAt" timestamp with time zone NOT NULL DEFAULT now(),
		"updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
		CONSTRAINT "user_email_unique" UNIQUE("email")
	)`;
	await sql`CREATE TABLE IF NOT EXISTS "session" (
		"id" text PRIMARY KEY NOT NULL,
		"token" text NOT NULL,
		"expiresAt" timestamp with time zone NOT NULL,
		"ipAddress" text,
		"userAgent" text,
		"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
	)`;
	await sql`CREATE TABLE IF NOT EXISTS "account" (
		"id" text PRIMARY KEY NOT NULL,
		"accountId" text NOT NULL,
		"providerId" text NOT NULL,
		"userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
		"accessToken" text,
		"refreshToken" text,
		"idToken" text,
		"expiresAt" timestamp with time zone,
		"accessTokenExpiresAt" timestamp with time zone,
		"refreshTokenExpiresAt" timestamp with time zone,
		"scope" text,
		"createdAt" timestamp with time zone NOT NULL DEFAULT now(),
		"updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
		"password" text
	)`;
	await sql`CREATE TABLE IF NOT EXISTS "verification" (
		"id" text PRIMARY KEY NOT NULL,
		"identifier" text NOT NULL,
		"value" text NOT NULL,
		"expiresAt" timestamp with time zone NOT NULL,
		"createdAt" timestamp with time zone NOT NULL DEFAULT now(),
		"updatedAt" timestamp with time zone NOT NULL DEFAULT now()
	)`;
	await sql`CREATE TABLE IF NOT EXISTS "blocked_artists" (
		"id" serial PRIMARY KEY NOT NULL,
		"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
		"spotify_artist_id" text NOT NULL,
		"name" text NOT NULL,
		"created_at" timestamp with time zone NOT NULL DEFAULT now()
	)`;
	console.log('Tables created. You should see user, session, account, verification, blocked_artists in Neon.');
} catch (err) {
	console.error('Create tables failed:', err.message);
	process.exit(1);
}
