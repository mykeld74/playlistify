import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

const SPOTIFY_RECENT = 'https://api.spotify.com/v1/me/player/recently-played';

export async function GET(event) {
	const { accessToken } = requireAuth(event);
	const url = new URL(SPOTIFY_RECENT);
	url.searchParams.set('limit', '50');
	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	const data = await res.json();
	return json(data);
}
