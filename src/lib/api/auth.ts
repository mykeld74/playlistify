import type { RequestEvent } from '@sveltejs/kit';
import { getDb } from '$lib/db';

export function requireAuth(event: RequestEvent): { userId: string; accessToken: string } {
	const user = event.locals.user;
	const accessToken = event.locals.accessToken;
	if (!user?.id || !accessToken) {
		throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		});
	}
	return { userId: user.id, accessToken };
}

export function getDbFromEvent(_event: RequestEvent) {
	return getDb();
}
