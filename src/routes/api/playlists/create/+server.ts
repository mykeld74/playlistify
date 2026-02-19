import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireAuth, getDbFromEvent } from '$lib/api/auth';
import { users } from '$lib/db/schema';

export async function POST(event) {
	const { userId, accessToken } = requireAuth(event);
	const db = getDbFromEvent(event);
	const body = await event.request.json().catch(() => ({})) as { name?: string; trackUris?: string[] };
	const name = (body.name ?? 'New Playlist').trim();
	const trackUris = Array.isArray(body.trackUris) ? body.trackUris.filter((u) => typeof u === 'string') : [];

	const userList = await db.select().from(users).where(eq(users.id, userId));
	const user = userList[0] ?? null;
	if (!user?.spotifyId) {
		return json({ error: 'User Spotify ID not found' }, { status: 400 });
	}

	// Create playlist
	const createRes = await fetch(
		`https://api.spotify.com/v1/users/${user.spotifyId}/playlists`,
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

	// Add tracks in batches of 100 (Spotify limit)
	if (trackUris.length > 0) {
		for (let i = 0; i < trackUris.length; i += 100) {
			const batch = trackUris.slice(i, i + 100);
			const addRes = await fetch(
				`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ uris: batch }),
				},
			);
			if (!addRes.ok) {
				const text = await addRes.text();
				return json({ error: 'Playlist created but adding tracks failed: ' + text }, { status: addRes.status });
			}
		}
	}

	return json({
		playlistId: playlist.id,
		url: playlist.external_urls?.spotify,
	});
}
