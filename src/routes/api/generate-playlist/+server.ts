import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { requireAuth, getDbFromEvent } from '$lib/api/auth';
import { blockedArtists } from '$lib/db/schema';
import { generatePlaylistWithAi } from '$lib/ai/generatePlaylist';
import { getEnv } from '$lib/env';

export async function POST(event) {
	const { userId, accessToken } = requireAuth(event);
	const env = getEnv();
	if (!env.ANTHROPIC_API_KEY) {
		return json(
			{ error: 'ANTHROPIC_API_KEY is not set. Add it to .env.' },
			{ status: 503 },
		);
	}

	const body = await event.request.json().catch(() => ({})) as {
		seedArtists?: string[];
		seedGenres?: string[];
		seedPlaylists?: { name: string; trackSummary: string }[];
		prompt?: string;
		limit?: number;
	};
	const MAX_SEED_STRING = 200;
	const seedArtists = Array.isArray(body.seedArtists)
		? body.seedArtists.map((s) => String(s).trim()).filter(Boolean).slice(0, 10).map((s) => s.slice(0, MAX_SEED_STRING))
		: [];
	const seedGenres = Array.isArray(body.seedGenres)
		? body.seedGenres.map((s) => String(s).trim()).filter(Boolean).slice(0, 10).map((s) => s.slice(0, MAX_SEED_STRING))
		: [];
	const rawPlaylists = Array.isArray(body.seedPlaylists) ? body.seedPlaylists.slice(0, 10) : [];
	const seedPlaylists = rawPlaylists
		.filter((p) => p && typeof p.name === 'string' && typeof p.trackSummary === 'string')
		.map((p) => ({ name: String(p.name).slice(0, MAX_SEED_STRING), trackSummary: String(p.trackSummary).slice(0, 2000) }));
	const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 500) : undefined;
	const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 200);

	if (seedArtists.length === 0 && seedGenres.length === 0 && seedPlaylists.length === 0 && !prompt?.trim()) {
		return json(
			{ error: 'Provide at least one seed artist, genre, playlist, or a text description (prompt).' },
			{ status: 400 },
		);
	}

	const db = getDbFromEvent(event);
	const blocked = await db.select().from(blockedArtists).where(eq(blockedArtists.userId, userId));
	const blockedArtistNames = blocked.map((b) => b.name);
	const blockedArtistIds = blocked.map((b) => b.spotifyArtistId);

	try {
		const tracks = await generatePlaylistWithAi(env.ANTHROPIC_API_KEY!, accessToken, {
			seedArtists,
			seedGenres,
			seedPlaylists: seedPlaylists.length > 0 ? seedPlaylists : undefined,
			prompt,
			limit,
			blockedArtistNames,
			blockedArtistIds,
		});
		return json({ tracks });
	} catch (e) {
		console.error('AI playlist generation failed', e);
		const message = e instanceof Error ? e.message : 'Generation failed';
		return json({ error: message }, { status: 500 });
	}
}
