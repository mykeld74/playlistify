import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireAuth, getDbFromEvent } from '$lib/api/auth';
import { blockedArtists } from '$lib/db/schema';

export async function GET(event) {
	const { userId } = requireAuth(event);
	const db = getDbFromEvent(event);
	const list = await db
		.select()
		.from(blockedArtists)
		.where(eq(blockedArtists.userId, userId));
	return json({ blocklist: list });
}

export async function POST(event) {
	const { userId } = requireAuth(event);
	const db = getDbFromEvent(event);
	const body = await event.request.json().catch(() => ({})) as { spotifyArtistId?: string; name?: string };
	const spotifyArtistId = body.spotifyArtistId?.trim();
	const name = (body.name ?? '').trim();
	if (!spotifyArtistId || !name) {
		return json({ error: 'spotifyArtistId and name are required' }, { status: 400 });
	}
	const existingList = await db
		.select()
		.from(blockedArtists)
		.where(eq(blockedArtists.userId, userId));
	if (existingList.some((d) => d.spotifyArtistId === spotifyArtistId)) {
		return json({ error: 'Artist already in blocklist' }, { status: 409 });
	}
	const now = new Date();
	const [inserted] = await db
		.insert(blockedArtists)
		.values({
			userId,
			spotifyArtistId,
			name,
			createdAt: now,
		})
		.returning();
	return json(inserted!);
}
