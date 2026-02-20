import Anthropic from '@anthropic-ai/sdk';

export type GenerateInput = {
	seedArtists: string[];
	seedGenres: string[];
	seedPlaylists?: { name: string; trackSummary: string }[];
	prompt?: string;
	limit: number;
	blockedArtistNames: string[];
	/** Spotify artist IDs to exclude from results (hard filter). */
	blockedArtistIds: string[];
};

export type TrackResult = {
	uri: string;
	name: string;
	artists: string;
	artistIds: string[];
	album?: string;
};

const MODEL = 'claude-sonnet-4-6';

/**
 * Ask Claude for a list of "Artist - Track" lines, then resolve each to a Spotify track.
 */
export async function generatePlaylistWithAi(
	apiKey: string,
	accessToken: string,
	input: GenerateInput,
): Promise<TrackResult[]> {
	const anthropic = new Anthropic({ apiKey });
	const { seedArtists, seedGenres, seedPlaylists, prompt, limit, blockedArtistNames, blockedArtistIds } = input;
	const blockedIdSet = new Set(blockedArtistIds.filter(Boolean));

	const seedParts: string[] = [];
	if (seedArtists.length) seedParts.push(`Artists: ${seedArtists.join(', ')}`);
	if (seedGenres.length) seedParts.push(`Genres: ${seedGenres.join(', ')}`);
	if (seedPlaylists?.length) {
		for (const pl of seedPlaylists) {
			seedParts.push(`Reference playlist "${pl.name}" (songs like: ${pl.trackSummary})`);
		}
	}
	const seedBlock = seedParts.length ? seedParts.join('.\n') + '.\n' : '';
	const blockBlock =
		blockedArtistNames.length > 0
			? `Do NOT include any songs by these artists: ${blockedArtistNames.join(', ')}.\n`
			: '';
	const userPrompt = prompt?.trim() ? `Additional direction: ${prompt}\n` : '';

	const systemPrompt = `You are a music curator. Reply with only a playlist: one line per song in the exact format "Artist - Track Name".
No numbering, no extra text, no explanations.
Use well-known, real artists and songs that exist on Spotify.
Treat the provided artists, genres, and reference playlists strictly as STYLE and VIBE references — use them to infer mood, era, tempo, and energy.
Do NOT simply repeat the seed songs; instead, choose songs that would fit well next to them on a playlist.
When specific seed artists are provided, heavily feature them in the playlist with multiple tracks per artist when appropriate, and then surround them with songs by other artists that clearly share a similar style.`;

	const userMessage = `${seedBlock}${blockBlock}${userPrompt}Generate exactly ${limit} songs for a playlist that has a similar vibe, mood, and energy to the seeds.
Include a mix of tracks by those artists and by other artists with clearly similar style.
Reply with only the list, one "Artist - Track Name" per line.`;

	const message = await anthropic.messages.create({
		model: MODEL,
		max_tokens: 4096,
		system: systemPrompt,
		messages: [{ role: 'user', content: userMessage }],
	});

	const raw =
		message.content
			?.filter((block) => block.type === 'text' && 'text' in block)
			.map((block) => (block as { type: 'text'; text: string }).text)
			.join('\n') ?? '';
	const lines = raw
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	const pairs: { artist: string; track: string }[] = [];
	for (const line of lines) {
		const match = line.match(/^(.+?)\s*[-–—|]\s*(.+)$/);
		if (match) {
			pairs.push({ artist: match[1].trim(), track: match[2].trim() });
		}
	}

	// Search all pairs concurrently, then filter in order
	const searched = await Promise.all(
		pairs.map(({ artist, track }) => searchSpotifyTrack(accessToken, artist, track)),
	);

	const results: TrackResult[] = [];
	const seenUris = new Set<string>();

	for (const t of searched) {
		if (results.length >= limit) break;
		if (!t || seenUris.has(t.uri)) continue;
		if (t.artistIds.some((id) => blockedIdSet.has(id))) continue;
		seenUris.add(t.uri);
		results.push(t);
	}

	return results;
}

async function searchSpotifyTrack(
	accessToken: string,
	artist: string,
	track: string,
): Promise<TrackResult | null> {
	const q = `artist:${artist.replace(/"/g, '')} track:${track.replace(/"/g, '')}`;
	const res = await fetch(
		`https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: 'track', limit: '1' })}`,
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);
	if (!res.ok) return null;
	const data = (await res.json()) as {
		tracks?: { items?: { uri: string; name: string; artists: { id: string; name: string }[]; album?: { name: string } }[] };
	};
	const item = data.tracks?.items?.[0];
	if (!item) return null;
	return {
		uri: item.uri,
		name: item.name,
		artists: item.artists?.map((a) => a.name).join(', ') ?? '',
		artistIds: item.artists?.map((a) => a.id) ?? [],
		album: item.album?.name,
	};
}
