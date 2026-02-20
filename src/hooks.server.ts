import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { getDb } from '$lib/db';
import { getEnv } from '$lib/env';
import { betterAuthAccount } from '$lib/db/schema';

export async function handle({ event, resolve }) {
	if (building) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	const session = await auth.api.getSession({
		headers: event.request.headers,
	});

	if (session?.user && session?.session) {
		const db = getDb();
		const [accounts, tokenRes] = await Promise.all([
			db
				.select()
				.from(betterAuthAccount)
				.where(
					and(
						eq(betterAuthAccount.userId, session.user.id),
						eq(betterAuthAccount.providerId, 'spotify'),
					),
				),
			auth.api.getAccessToken({
				body: { providerId: 'spotify' },
				headers: event.request.headers,
			}),
		]);
		const spotifyAccount = accounts[0] ?? null;

		const allowedSpotifyId = getEnv().ALLOWED_SPOTIFY_ID;
		if (allowedSpotifyId && (!spotifyAccount || spotifyAccount.accountId !== allowedSpotifyId)) {
			if (event.url.pathname !== '/access-denied') {
				return new Response(null, {
					status: 302,
					headers: { Location: '/access-denied' },
				});
			}
			return svelteKitHandler({ event, resolve, auth, building });
		}

		event.locals.session = session.session;
		event.locals.user = session.user;
		event.locals.spotifyUserId = spotifyAccount?.accountId ?? null;
		if (tokenRes?.accessToken) {
			event.locals.accessToken = tokenRes.accessToken;
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
