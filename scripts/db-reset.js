/**
 * Drops all app tables and Drizzle's migration table so you can run
 * migrations from scratch. USE ONLY IF YOU ARE OK LOSING ALL DATA.
 *
 *   pnpm run db:reset
 *
 * Then run: pnpm run db:migrate
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
	await sql`DROP TABLE IF EXISTS "blocked_artists" CASCADE`;
	await sql`DROP TABLE IF EXISTS "account" CASCADE`;
	await sql`DROP TABLE IF EXISTS "session" CASCADE`;
	await sql`DROP TABLE IF EXISTS "user" CASCADE`;
	await sql`DROP TABLE IF EXISTS "verification" CASCADE`;
	await sql`DROP TABLE IF EXISTS "sessions" CASCADE`;
	await sql`DROP TABLE IF EXISTS "users" CASCADE`;
	await sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`;
	await sql`DROP TABLE IF EXISTS "__drizzle_migrations__" CASCADE`;
	console.log('All tables dropped. Run: pnpm run db:migrate');
} catch (err) {
	console.error('Reset failed:', err.message);
	process.exit(1);
}
