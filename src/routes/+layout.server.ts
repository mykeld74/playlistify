export async function load(event) {
	const user = event.locals.user;
	if (!user) {
		return { user: null };
	}
	return {
		user: {
			id: user.id,
			displayName: user.name ?? null,
			imageUrl: user.image ?? null,
		},
	};
}
