// Avoid 404 when browsers request /favicon.ico; the real icon is set via <link rel="icon"> in layout.
export async function GET() {
	return new Response(null, { status: 204 });
}
