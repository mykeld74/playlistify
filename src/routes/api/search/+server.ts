import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

const SPOTIFY_SEARCH = 'https://api.spotify.com/v1/search';

export async function GET(event) {
	requireAuth(event);
	const q = event.url.searchParams.get('q')?.trim();
	const type = event.url.searchParams.get('type') || 'artist,track';
	if (!q || q.length < 2) {
		return json({ error: 'Query "q" required (min 2 chars)' }, { status: 400 });
	}
	const params = new URLSearchParams({ q, type, limit: '20' });
	const res = await fetch(`${SPOTIFY_SEARCH}?${params.toString()}`, {
		headers: { Authorization: `Bearer ${event.locals.accessToken}` },
	});
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	const data = await res.json();
	return json(data);
}
