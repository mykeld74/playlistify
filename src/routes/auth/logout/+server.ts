import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/db';
import { sessions } from '$lib/db/schema';
import { getSessionIdFromCookie } from '$lib/auth/session';
import { getEnv } from '$lib/env';

export async function POST({ request, cookies }) {
	const env = getEnv();

	if (env.DATABASE_URL && env.SESSION_SECRET) {
		const sessionId = getSessionIdFromCookie(request.headers.get('cookie'), env.SESSION_SECRET);
		if (sessionId) {
			const db = getDb();
			await db.delete(sessions).where(eq(sessions.id, sessionId));
		}
	}

	cookies.delete('playlistify_session', { path: '/' });
	throw redirect(302, '/');
}
