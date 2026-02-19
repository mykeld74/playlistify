import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from '$lib/db';

export function requireAuth(event: RequestEvent): { userId: string; accessToken: string } {
	const userId = event.locals.userId;
	const accessToken = event.locals.accessToken;
	if (!userId || !accessToken) {
		throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return { userId, accessToken };
}

export function getDbFromEvent(_event: RequestEvent) {
	return getDb();
}
