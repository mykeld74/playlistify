import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getEnv } from '$lib/env';

let cached: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (cached) return cached;
	const env = getEnv();
	const url = env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set');
	const sql = neon(url);
	cached = drizzle(sql, { schema });
	return cached;
}

export type Db = ReturnType<typeof getDb>;
