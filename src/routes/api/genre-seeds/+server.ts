import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

export async function GET(event) {
	requireAuth(event);
	const res = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
		headers: { Authorization: `Bearer ${event.locals.accessToken}` },
	});
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	const data = await res.json();
	return json(data);
}
