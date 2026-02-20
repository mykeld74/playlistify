import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/api/auth';

export async function GET(event) {
	const { userId } = requireAuth(event);
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'User not found' }, { status: 404 });
	}
	return json({
		id: user.id,
		userId,
		displayName: user.name ?? null,
		imageUrl: user.image ?? null,
		email: user.email ?? null,
	});
}
