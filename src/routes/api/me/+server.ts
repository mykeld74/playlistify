import { json } from '@sveltejs/kit';
import { requireAuth, getDbFromEvent } from '$lib/api/auth';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(event) {
	const { userId } = requireAuth(event);
	const db = getDbFromEvent(event);
	const userList = await db.select().from(users).where(eq(users.id, userId));
	const user = userList[0] ?? null;
	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	return json({
		id: user.id,
		spotifyId: user.spotifyId,
		displayName: user.displayName,
		imageUrl: user.imageUrl,
	});
}
