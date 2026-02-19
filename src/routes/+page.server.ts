export async function load(event) {
	return {
		error: event.url.searchParams.get('error'),
	};
}
