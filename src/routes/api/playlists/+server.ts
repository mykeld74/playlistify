import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

const SPOTIFY_PLAYLISTS = 'https://api.spotify.com/v1/me/playlists';

const MAX_PAGES = 20; // cap at 1000 playlists (20 pages × 50)

export async function GET(event) {
	const { accessToken } = requireAuth(event);
	const headers = { Authorization: `Bearer ${accessToken}` };
	const allItems: unknown[] = [];
	let nextUrl: string | null = `${SPOTIFY_PLAYLISTS}?limit=50`;
	let pages = 0;

	while (nextUrl && pages < MAX_PAGES) {
		// Guard against SSRF: only follow Spotify API URLs
		if (!nextUrl.startsWith('https://api.spotify.com/')) break;
		const res = await fetch(nextUrl, { headers });
		if (!res.ok) {
			const text = await res.text();
			return json({ error: text }, { status: res.status });
		}
		const page = await res.json();
		allItems.push(...(page.items ?? []));
		nextUrl = typeof page.next === 'string' ? page.next : null;
		pages++;
	}

	return json({ items: allItems, total: allItems.length });
}
