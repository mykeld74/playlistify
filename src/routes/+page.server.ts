const KNOWN_ERRORS = new Set(['token_exchange_failed', 'db_setup']);

export async function load(event) {
	const raw = event.url.searchParams.get('error');
	return {
		error: raw && KNOWN_ERRORS.has(raw) ? raw : null,
	};
}
