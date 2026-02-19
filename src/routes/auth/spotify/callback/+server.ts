import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { exchangeCodeForTokens } from '$lib/auth/spotify';
import {
	verifyStateCookie,
	createSession,
	getSessionCookieValue,
} from '$lib/auth/session';
import { getEnv } from '$lib/env';

const SPOTIFY_ME = 'https://api.spotify.com/v1/me';

export async function GET({ url, request, cookies }) {
	const env = getEnv();
	if (!env.DATABASE_URL || !env.SESSION_SECRET) {
		return new Response('Server not configured', { status: 500 });
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) {
		cookies.delete('playlistify_oauth_state', { path: '/' });
		throw redirect(302, '/?error=' + encodeURIComponent(error));
	}

	const stateCookie = cookies.get('playlistify_oauth_state');
	const verifiedState = stateCookie ? verifyStateCookie(stateCookie, env.SESSION_SECRET) : null;
	if (!state || verifiedState !== state) {
		throw redirect(302, '/?error=state_mismatch');
	}

	if (!code) {
		throw redirect(302, '/?error=no_code');
	}

	let tokens: { accessToken: string; refreshToken: string; expiresIn: number };
	try {
		tokens = await exchangeCodeForTokens(env, code);
	} catch (e) {
		console.error('Token exchange failed', e);
		throw redirect(302, '/?error=token_exchange_failed');
	}

	const meRes = await fetch(SPOTIFY_ME, {
		headers: { Authorization: `Bearer ${tokens.accessToken}` },
	});
	if (!meRes.ok) {
		throw redirect(302, '/?error=me_failed');
	}
	const me = (await meRes.json()) as {
		id: string | number;
		display_name?: string;
		images?: { url: string }[];
	};
	const spotifyId = String(me.id);

	const db = getDb();
	const userId = crypto.randomUUID();
	const now = new Date();

	let existingList: { id: string }[];
	try {
		existingList = await db.select().from(users).where(eq(users.spotifyId, spotifyId));
	} catch (dbError) {
		console.error('Database query failed', dbError);
		throw redirect(302, '/?error=db_setup');
	}
	const existing = existingList[0] ?? null;
	const finalUserId = existing ? existing.id : userId;

	if (!existing) {
		await db.insert(users).values({
			id: userId,
			spotifyId,
			displayName: me.display_name ?? null,
			imageUrl: me.images?.[0]?.url ?? null,
			createdAt: now,
		});
	}

	const sessionId = await createSession(
		db,
		finalUserId,
		tokens.accessToken,
		tokens.refreshToken,
		tokens.expiresIn,
	);

	const maxAge = 60 * 60 * 24 * 30; // 30 days
	const isProduction = url.origin.startsWith('https://');
	cookies.set('playlistify_session', getSessionCookieValue(sessionId, env.SESSION_SECRET), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge,
		secure: isProduction,
	});
	cookies.delete('playlistify_oauth_state', { path: '/' });
	throw redirect(302, '/');
}
