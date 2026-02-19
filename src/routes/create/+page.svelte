<script lang="ts">
	let { data } = $props();

	type TrackItem = {
		uri: string;
		name: string;
		artists: string;
		artistIds: string[];
		album?: string;
	};

	let step = $state<'seeds' | 'preview' | 'upload'>('seeds');
	let seedArtists = $state<{ id: string; name: string }[]>([]);
	let seedTracks = $state<{ id: string; name: string }[]>([]);
	let seedGenres = $state<string[]>([]);
	let seedPlaylists = $state<{ id: string; name: string; trackSummary: string }[]>([]);
	let genreInput = $state('');
	let prompt = $state('');
	let limit = $state(20);
	let searchQuery = $state('');
	let searchResults = $state<{ artists?: { items: { id: string; name: string }[] }; tracks?: { items: { id: string; name: string; artists: { name: string }[] }[] } } | null>(null);
	let searchLoading = $state(false);
	let userPlaylists = $state<{ id: string; name: string }[]>([]);
	let playlistsLoading = $state(false);
	let generatedTracks = $state<TrackItem[]>([]);
	let playlistName = $state('My New Playlist');
	let generating = $state(false);
	let createError = $state<string | null>(null);
	let createSuccess = $state<string | null>(null);

	const totalSeeds = $derived(seedArtists.length + seedTracks.length + seedGenres.length + seedPlaylists.length);
	const hasSeedsOrPrompt = $derived(
		seedArtists.length > 0 || seedGenres.length > 0 || seedPlaylists.length > 0 || prompt.trim().length > 0,
	);
	const canGenerate = $derived(hasSeedsOrPrompt && limit >= 1 && limit <= 200);
	const maxSeeds = 10;

	async function search() {
		const q = searchQuery.trim();
		if (q.length < 2) return;
		searchLoading = true;
		searchResults = null;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=artist,track`);
			if (res.ok) searchResults = await res.json();
		} finally {
			searchLoading = false;
		}
	}

	function addSeedArtist(a: { id: string; name: string }) {
		if (totalSeeds >= maxSeeds || seedArtists.some((s) => s.id === a.id)) return;
		seedArtists = [...seedArtists, a];
	}
	function addSeedTrack(t: { id: string; name: string }) {
		if (totalSeeds >= maxSeeds || seedTracks.some((s) => s.id === t.id)) return;
		seedTracks = [...seedTracks, t];
	}
	function removeSeedArtist(id: string) {
		seedArtists = seedArtists.filter((a) => a.id !== id);
	}
	function removeSeedTrack(id: string) {
		seedTracks = seedTracks.filter((t) => t.id !== id);
	}
	function addSeedGenres() {
		const toAdd = genreInput.split(',').map((g) => g.trim().toLowerCase()).filter(Boolean);
		for (const g of toAdd) {
			if (totalSeeds >= maxSeeds) break;
			if (!seedGenres.includes(g)) seedGenres = [...seedGenres, g];
		}
		genreInput = '';
	}
	function removeSeedGenre(g: string) {
		seedGenres = seedGenres.filter((x) => x !== g);
	}

	async function loadPlaylists() {
		if (userPlaylists.length > 0) return;
		playlistsLoading = true;
		try {
			const res = await fetch('/api/playlists');
			if (res.ok) {
				const data = await res.json();
				userPlaylists = (data.items ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }));
			}
		} finally {
			playlistsLoading = false;
		}
	}

	async function addSeedPlaylist(pl: { id: string; name: string }) {
		if (totalSeeds >= maxSeeds || seedPlaylists.some((s) => s.id === pl.id)) return;
		try {
			const res = await fetch(`/api/playlist/${encodeURIComponent(pl.id)}/tracks`);
			if (!res.ok) return;
			const data = await res.json();
			const tracks = data.tracks ?? [];
			const trackSummary = tracks
				.slice(0, 30)
				.map((t: { name: string; artists: string }) => `${t.artists ? t.artists + ' - ' : ''}${t.name}`)
				.join('; ');
			seedPlaylists = [...seedPlaylists, { id: pl.id, name: pl.name, trackSummary: trackSummary || pl.name }];
		} catch {
			// ignore
		}
	}
	function removeSeedPlaylist(id: string) {
		seedPlaylists = seedPlaylists.filter((p) => p.id !== id);
	}

	async function generate() {
		if (!data.user) return;
		if (!hasSeedsOrPrompt) {
			createError = 'Add at least one artist or genre above, or describe your playlist (e.g. "chill study music").';
			return;
		}
		if (limit < 1 || limit > 200) {
			createError = 'Set number of songs between 1 and 200.';
			return;
		}
		generating = true;
		createError = null;
		createSuccess = null;
		try {
			const res = await fetch('/api/generate-playlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					seedArtists: seedArtists.map((a) => a.name),
					seedGenres,
					seedPlaylists: seedPlaylists.map((p) => ({ name: p.name, trackSummary: p.trackSummary })),
					prompt: prompt.trim() || undefined,
					limit,
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				createError = json.error ?? res.statusText;
				return;
			}
			generatedTracks = (json.tracks ?? []).map((t: TrackItem) => ({
				uri: t.uri,
				name: t.name,
				artists: t.artists,
				artistIds: t.artistIds ?? [],
				album: t.album,
			}));
			step = 'preview';
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to generate';
		} finally {
			generating = false;
		}
	}

	function moveTrack(from: number, to: number) {
		if (to < 0 || to >= generatedTracks.length) return;
		const arr = [...generatedTracks];
		const [removed] = arr.splice(from, 1);
		arr.splice(to, 0, removed);
		generatedTracks = arr;
	}

	function removeTrack(index: number) {
		generatedTracks = generatedTracks.filter((_, i) => i !== index);
	}

	async function blockArtist(artistId: string, name: string) {
		try {
			const res = await fetch('/api/blocklist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ spotifyArtistId: artistId, name }),
			});
			if (res.ok) {
				generatedTracks = generatedTracks.filter((t) => !t.artistIds.includes(artistId));
			}
		} catch {
			// ignore
		}
	}

	async function createOnSpotify() {
		if (!data.user) return;
		createError = null;
		createSuccess = null;
		try {
			const res = await fetch('/api/playlists/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: playlistName.trim() || 'My New Playlist',
					trackUris: generatedTracks.map((t) => t.uri),
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				createError = json.error ?? res.statusText;
				return;
			}
			createSuccess = json.url ?? `Playlist created (ID: ${json.playlistId})`;
		} catch (e) {
			createError = e instanceof Error ? e.message : 'Failed to create';
		}
	}
</script>

{#if !data.user}
	<p>Log in to create playlists.</p>
	<a href="/auth/spotify"><button class="primary">Log in with Spotify</button></a>
{:else}
	<h1 style="margin-top: 0;">Create Playlist</h1>

	{#if step === 'seeds'}
		<div class="card" style="margin-bottom: 1.5rem;">
			<label for="search-query" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Search artists or tracks (add as seeds)</label>
			<div style="display: flex; gap: 0.5rem;">
				<input id="search-query" type="text" bind:value={searchQuery} placeholder="Artist or track name" onkeydown={(e) => e.key === 'Enter' && search()} />
				<button type="button" class="primary" onclick={search} disabled={searchLoading}>{searchLoading ? 'Searching…' : 'Search'}</button>
			</div>
			{#if searchResults}
				<div style="margin-top: 1rem;">
					{#if searchResults.artists?.items?.length}
						<p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem;">Artists</p>
						<ul class="seed-list scroll-list" style="list-style: none; padding: 0; max-height: 10rem;">
							{#each searchResults.artists.items as a}
								<li class="seed-row">
									<span class="label">{a.name}</span>
									<button type="button" class="secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => addSeedArtist(a)} disabled={totalSeeds >= maxSeeds || seedArtists.some((s) => s.id === a.id)}>+ Add</button>
								</li>
							{/each}
						</ul>
					{/if}
					{#if searchResults.tracks?.items?.length}
						<p style="font-size: 0.9rem; color: var(--text-muted); margin: 0.75rem 0 0.25rem;">Tracks</p>
						<ul class="seed-list scroll-list" style="list-style: none; padding: 0; max-height: 10rem;">
							{#each searchResults.tracks.items as t}
								<li class="seed-row">
									<span class="label">{t.name} · {t.artists?.map((a) => a.name).join(', ')}</span>
									<button type="button" class="secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => addSeedTrack({ id: t.id, name: t.name })} disabled={totalSeeds >= maxSeeds || seedTracks.some((s) => s.id === t.id)}>+ Add</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</div>

		<div class="card" style="margin-bottom: 1rem;">
			<p style="margin: 0 0 0.5rem; font-weight: 600;">Add an existing playlist as seed</p>
			<button type="button" class="secondary" onclick={loadPlaylists} disabled={playlistsLoading || totalSeeds >= maxSeeds}>
				{playlistsLoading ? 'Loading…' : userPlaylists.length ? 'Refresh playlists' : 'Show my playlists'}
			</button>
			{#if userPlaylists.length > 0}
				<ul class="scroll-list seed-list" style="margin-top: 0.75rem; max-height: 12rem;">
					{#each userPlaylists as pl}
						<li>
							<button type="button" class="secondary" style="width: 100%; justify-content: space-between; text-align: left;" onclick={() => addSeedPlaylist(pl)} disabled={totalSeeds >= maxSeeds || seedPlaylists.some((s) => s.id === pl.id)}>
								<span>{pl.name}</span>
								<span style="color: var(--text-muted);">+ Add as seed</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="card" style="margin-bottom: 1rem;">
			<label for="genre-input" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Genre seeds (e.g. pop, rock)</label>
			<div style="display: flex; gap: 0.5rem;">
				<input id="genre-input" type="text" bind:value={genreInput} placeholder="pop, rock, indie" style="max-width: 14rem;" onkeydown={(e) => e.key === 'Enter' && addSeedGenres()} />
				<button type="button" class="secondary" onclick={addSeedGenres} disabled={totalSeeds >= maxSeeds}>Add genres</button>
			</div>
		</div>

		<div class="card" style="margin-bottom: 1rem;">
			<label for="prompt-input" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Describe your playlist (optional)</label>
			<input id="prompt-input" type="text" bind:value={prompt} placeholder="e.g. rainy day vibes, workout energy, focus" style="max-width: 100%;" />
		</div>

		<div class="card" style="margin-bottom: 1.5rem;">
			<p style="margin: 0 0 0.5rem; font-weight: 600;">Seeds for AI ({totalSeeds}/{maxSeeds})</p>
			<ul class="seed-list" style="list-style: none; padding: 0; margin: 0;">
				{#each seedArtists as a}
					<li class="seed-row">
						<span class="label">{a.name}</span>
						<span class="type">artist</span>
						<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick={() => removeSeedArtist(a.id)}>Remove</button>
					</li>
				{/each}
				{#each seedTracks as t}
					<li class="seed-row">
						<span class="label">{t.name}</span>
						<span class="type">track</span>
						<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick={() => removeSeedTrack(t.id)}>Remove</button>
					</li>
				{/each}
				{#each seedGenres as g}
					<li class="seed-row">
						<span class="label">{g}</span>
						<span class="type">genre</span>
						<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick={() => removeSeedGenre(g)}>Remove</button>
					</li>
				{/each}
				{#each seedPlaylists as p}
					<li class="seed-row">
						<span class="label">{p.name}</span>
						<span class="type">playlist</span>
						<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" onclick={() => removeSeedPlaylist(p.id)}>Remove</button>
					</li>
				{/each}
			</ul>
			{#if totalSeeds === 0 && !prompt.trim()}
				<p style="color: var(--text-muted); margin: 0.5rem 0 0;">Add artists, genres, a playlist above, or describe the playlist.</p>
			{/if}
		</div>

		<div class="card" style="margin-bottom: 1.5rem;">
			<label for="limit-input" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Number of songs (1–200)</label>
			<input id="limit-input" type="number" bind:value={limit} min={1} max={200} style="width: 6rem;" />
		</div>

		<button type="button" class="primary" onclick={generate} disabled={generating}>
			{generating ? 'Generating…' : 'Generate playlist'}
		</button>
		{#if !hasSeedsOrPrompt}
			<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.75rem;">Add artists or genres above, or type a description (e.g. "rainy day vibes"), then click Generate.</p>
		{/if}
		{#if createError}
			<p style="color: var(--danger); margin-top: 1rem;">{createError}</p>
		{/if}
	{:else if step === 'preview'}
		<div class="card" style="margin-bottom: 1rem;">
			<label for="playlist-name" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Playlist name</label>
			<input id="playlist-name" type="text" bind:value={playlistName} placeholder="My New Playlist" />
		</div>
		<p style="color: var(--text-muted); margin-bottom: 0.5rem;">Edit the list (reorder or remove), then upload to Spotify.</p>
		<ul class="scroll-list" style="list-style: none; padding: 0; margin: 0;">
			{#each generatedTracks as track, i}
				<li class="list-card">
					<span class="num">{i + 1}</span>
					<div class="main">
						<span class="title">{track.name}</span>
						<span class="meta">{track.artists}</span>
					</div>
					<button type="button" class="secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => moveTrack(i, i - 1)} disabled={i === 0}>↑</button>
					<button type="button" class="secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => moveTrack(i, i + 1)} disabled={i === generatedTracks.length - 1}>↓</button>
					{#if track.artistIds[0]}
						<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => blockArtist(track.artistIds[0], track.artists.split(',')[0]?.trim() ?? 'Artist')} title="Add to blocklist and remove from list">Block artist</button>
					{/if}
					<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => removeTrack(i)}>Remove</button>
				</li>
			{/each}
		</ul>
		<div style="margin-top: 1rem;">
			<button type="button" class="secondary" style="margin-right: 0.5rem;" onclick={() => step = 'seeds'}>&lt; Back to seeds</button>
			<button type="button" class="primary" onclick={createOnSpotify}>Upload to Spotify</button>
		</div>
		{#if createError}
			<p style="color: var(--danger); margin-top: 1rem;">{createError}</p>
		{/if}
		{#if createSuccess}
			<p style="color: var(--accent); margin-top: 1rem;">
				Success! <a href={createSuccess} target="_blank" rel="noopener noreferrer">Open playlist in Spotify</a>
			</p>
		{/if}
	{/if}
{/if}
