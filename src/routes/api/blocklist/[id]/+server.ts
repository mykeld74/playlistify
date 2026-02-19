import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { requireAuth, getDbFromEvent } from '$lib/api/auth';
import { blockedArtists } from '$lib/db/schema';

export async function DELETE(event) {
	const { userId } = requireAuth(event);
	const db = getDbFromEvent(event);
	const id = event.params.id;
	if (!id) return json({ error: 'Missing id' }, { status: 400 });
	const numericId = parseInt(id, 10);
	if (Number.isNaN(numericId)) return json({ error: 'Invalid id' }, { status: 400 });

	const result = await db
		.delete(blockedArtists)
		.where(and(eq(blockedArtists.id, numericId), eq(blockedArtists.userId, userId)))
		.returning();
	if (result.length === 0) {
		return json({ error: 'Not found' }, { status: 404 });
	}
	return json({ ok: true });
}
