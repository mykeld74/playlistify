import { getSessionWithRefresh } from '$lib/auth/session';
import { getDb } from '$lib/db';
import { getEnv } from '$lib/env';

export async function handle({ event, resolve }) {
	const env = getEnv();
	if (env.DATABASE_URL && env.SESSION_SECRET) {
		const db = getDb();
		const cookieHeader = event.request.headers.get('cookie');
		const session = await getSessionWithRefresh(db, cookieHeader, env.SESSION_SECRET, env);
		if (session) {
			event.locals.userId = session.userId;
			event.locals.accessToken = session.accessToken;
		}
	}

	return resolve(event);
}
