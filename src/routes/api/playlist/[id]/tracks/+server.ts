import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

export async function GET(event) {
	const { accessToken } = requireAuth(event);
	const id = event.params.id;
	if (!id) return json({ error: 'Missing playlist id' }, { status: 400 });

	const res = await fetch(
		`https://api.spotify.com/v1/playlists/${encodeURIComponent(id)}/tracks?limit=50`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	const data = (await res.json()) as {
		items?: { track?: { name: string; artists?: { name: string }[] } }[];
	};
	const tracks = (data.items ?? [])
		.map((item) => item.track)
		.filter(Boolean)
		.map((t) => ({
			name: t!.name,
			artists: t!.artists?.map((a) => a.name).join(', ') ?? '',
		}));
	return json({ tracks });
}
