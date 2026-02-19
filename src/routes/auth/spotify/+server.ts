import { redirect } from '@sveltejs/kit';
import { getSpotifyAuthUrl } from '$lib/auth/spotify';
import { setStateCookie } from '$lib/auth/session';
import { getEnv } from '$lib/env';

export async function GET({ cookies }) {
	const env = getEnv();
	if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_REDIRECT_URI || !env.SESSION_SECRET) {
		return new Response(
			'Spotify and session env are not set. Copy .env.example to .env and set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, and SESSION_SECRET, then run: pnpm dev',
			{ status: 503, headers: { 'Content-Type': 'text/plain' } },
		);
	}
	const state = crypto.randomUUID();
	const stateValue = setStateCookie(state, env.SESSION_SECRET);
	const authUrl = getSpotifyAuthUrl(env, state);

	cookies.set('playlistify_oauth_state', stateValue, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 600,
	});
	throw redirect(302, authUrl);
}
