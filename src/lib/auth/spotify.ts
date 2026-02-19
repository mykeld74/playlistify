const SPOTIFY_AUTH = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN = 'https://accounts.spotify.com/api/token';

import type { Env } from '$lib/env';

const SCOPES = [
	'playlist-read-private',
	'playlist-modify-private',
	'playlist-modify-public',
	'user-read-recently-played',
	'user-read-private',
].join(' ');

export function getSpotifyAuthUrl(env: Env, state: string): string {
	const redirectUri = (env.SPOTIFY_REDIRECT_URI ?? '').replace(/\/$/, ''); // no trailing slash
	const params = new URLSearchParams({
		client_id: env.SPOTIFY_CLIENT_ID,
		response_type: 'code',
		redirect_uri: redirectUri,
		scope: SCOPES,
		state,
	});
	return `${SPOTIFY_AUTH}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
	env: Env,
	code: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
	const redirectUri = (env.SPOTIFY_REDIRECT_URI ?? '').replace(/\/$/, ''); // no trailing slash - must match auth request exactly
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
	});
	const basic = btoa(`${env.SPOTIFY_CLIENT_ID ?? ''}:${env.SPOTIFY_CLIENT_SECRET ?? ''}`);
	const res = await fetch(SPOTIFY_TOKEN, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${basic}`,
		},
		body: body.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Spotify token exchange failed: ${res.status} ${text}`);
	}
	const data = (await res.json()) as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
	};
	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

export async function refreshAccessToken(
	env: Env,
	refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken,
	});
	const basic = btoa(`${env.SPOTIFY_CLIENT_ID ?? ''}:${env.SPOTIFY_CLIENT_SECRET ?? ''}`);
	const res = await fetch(SPOTIFY_TOKEN, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${basic}`,
		},
		body: body.toString(),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Spotify refresh failed: ${res.status} ${text}`);
	}
	const data = (await res.json()) as { access_token: string; expires_in: number };
	return { accessToken: data.access_token, expiresIn: data.expires_in };
}
