import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

export async function POST(event) {
	const { accessToken } = requireAuth(event);
	const spotifyUserId = event.locals.spotifyUserId;
	if (!spotifyUserId) {
		return json({ error: 'User Spotify ID not found' }, { status: 400 });
	}

	const body = await event.request.json().catch(() => ({})) as { name?: string; trackUris?: string[] };
	const name = (body.name ?? 'New Playlist').trim().slice(0, 100);
	const SPOTIFY_TRACK_URI = /^spotify:track:[A-Za-z0-9]+$/;
	const trackUris = Array.isArray(body.trackUris)
		? body.trackUris.filter((u) => typeof u === 'string' && SPOTIFY_TRACK_URI.test(u)).slice(0, 200)
		: [];

	// Create playlist
	const createRes = await fetch(
		`https://api.spotify.com/v1/users/${spotifyUserId}/playlists`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name, public: false }),
		},
	);
	if (!createRes.ok) {
		const text = await createRes.text();
		return json({ error: text }, { status: createRes.status });
	}
	const playlist = (await createRes.json()) as { id: string; external_urls?: { spotify?: string } };

	// Add tracks in batches of 100 (Spotify limit) — batches run concurrently
	if (trackUris.length > 0) {
		const batches: string[][] = [];
		for (let i = 0; i < trackUris.length; i += 100) {
			batches.push(trackUris.slice(i, i + 100));
		}
		const batchResults = await Promise.all(
			batches.map((batch) =>
				fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ uris: batch }),
				}),
			),
		);
		const failed = batchResults.find((r) => !r.ok);
		if (failed) {
			const text = await failed.text();
			return json({ error: 'Playlist created but adding tracks failed: ' + text }, { status: failed.status });
		}
	}

	return json({
		playlistId: playlist.id,
		url: playlist.external_urls?.spotify,
	});
}
