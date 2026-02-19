import { eq } from 'drizzle-orm';
import { getDb } from '$lib/db';
import { users } from '$lib/db/schema';
import { getEnv } from '$lib/env';

export async function load(event) {
	const userId = event.locals.userId;
	if (!userId) {
		return { user: null };
	}
	const env = getEnv();
	if (!env.DATABASE_URL) {
		return { user: null };
	}
	const db = getDb();
	const userList = await db.select().from(users).where(eq(users.id, userId));
	const user = userList[0] ?? null;
	if (!user) {
		return { user: null };
	}
	return {
		user: {
			id: user.id,
			displayName: user.displayName,
			imageUrl: user.imageUrl,
		},
	};
}
