import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

export async function PATCH(event) {
	const { accessToken } = requireAuth(event);
	const id = event.params.id;
	if (!id) return json({ error: 'Missing playlist id' }, { status: 400 });

	const body = await event.request.json().catch(() => ({})) as { name?: string; description?: string; public?: boolean };
	const name = typeof body.name === 'string' ? body.name.trim() : undefined;
	const description = typeof body.description === 'string' ? body.description : undefined;
	const isPublic = typeof body.public === 'boolean' ? body.public : undefined;

	if (name !== undefined && name.length === 0) {
		return json({ error: 'Playlist name cannot be empty' }, { status: 400 });
	}
	if (name === undefined && description === undefined && isPublic === undefined) {
		return json({ error: 'Provide at least one of name, description, or public' }, { status: 400 });
	}

	const payload: { name?: string; description?: string; public?: boolean } = {};
	if (name !== undefined) payload.name = name;
	if (description !== undefined) payload.description = description;
	if (isPublic !== undefined) payload.public = isPublic;

	const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(id)}`, {
		method: 'PUT',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	return json({ ok: true });
}

export async function DELETE(event) {
	const { accessToken } = requireAuth(event);
	const id = event.params.id;
	if (!id) return json({ error: 'Missing playlist id' }, { status: 400 });

	const res = await fetch(`https://api.spotify.com/v1/playlists/${encodeURIComponent(id)}/followers`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) {
		const text = await res.text();
		return json({ error: text }, { status: res.status });
	}
	return json({ ok: true });
}
