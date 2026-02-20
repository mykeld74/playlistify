/**
 * Fixes Better Auth tables so sign-in works:
 * - user: set DEFAULT now() for createdAt/updatedAt, default for emailVerified
 * - verification: add createdAt, updatedAt if missing
 * - account: add accessTokenExpiresAt, refreshTokenExpiresAt if missing
 *
 *   pnpm run db:repair
 *
 * Requires DATABASE_URL in .env (or environment).
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set. Set it in .env or the environment.');
	process.exit(1);
}

const sql = neon(url);

try {
	// session: token column required by Better Auth
	await sql`ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "token" text`;
	await sql`UPDATE "session" SET "token" = "id" WHERE "token" IS NULL`;
	await sql`ALTER TABLE "session" ALTER COLUMN "token" SET NOT NULL`;
	// user: defaults so Better Auth insert succeeds
	await sql`ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT now()`;
	await sql`ALTER TABLE "user" ALTER COLUMN "updatedAt" SET DEFAULT now()`;
	await sql`ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false`;
	// verification
	await sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone NOT NULL DEFAULT now()`;
	await sql`ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone NOT NULL DEFAULT now()`;
	// account
	await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" timestamp with time zone`;
	await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" timestamp with time zone`;
	await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text`;
	await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone NOT NULL DEFAULT now()`;
	await sql`ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone NOT NULL DEFAULT now()`;
	console.log('Done. Run sign-in again.');
} catch (err) {
	console.error('Repair failed:', err.message);
	process.exit(1);
}
