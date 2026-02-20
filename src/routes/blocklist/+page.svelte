<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let { data } = $props();

	type BlocklistItem = { id: number; name: string; spotifyArtistId: string };
	type ArtistHit = { id: string; name: string };

	let blocklist = $state<BlocklistItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let searchResults = $state<ArtistHit[]>([]);
	let searchLoading = $state(false);
	let addError = $state<string | null>(null);

	async function loadBlocklist() {
		if (!data.user) return;
		loading = true;
		try {
			const res = await fetch('/api/blocklist');
			if (res.ok) {
				const json = await res.json();
				blocklist = json.blocklist ?? [];
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (data.user) loadBlocklist();
	});

	async function searchArtists() {
		const q = searchQuery.trim();
		if (q.length < 2) return;
		searchLoading = true;
		addError = null;
		searchResults = [];
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=artist`);
			if (res.ok) {
				const data = await res.json();
				searchResults = (data.artists?.items ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }));
			}
		} finally {
			searchLoading = false;
		}
	}

	async function addToBlocklist(artist: ArtistHit) {
		addError = null;
		try {
			const res = await fetch('/api/blocklist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ spotifyArtistId: artist.id, name: artist.name }),
			});
			if (res.ok) {
				const inserted = await res.json();
				blocklist = [...blocklist, inserted];
				searchResults = searchResults.filter((a) => a.id !== artist.id);
			} else {
				const j = await res.json().catch(() => ({}));
				addError = j.error ?? 'Failed to add';
			}
		} catch (e) {
			addError = e instanceof Error ? e.message : 'Failed to add';
		}
	}

	async function remove(id: number) {
		try {
			const res = await fetch(`/api/blocklist/${id}`, { method: 'DELETE' });
			if (res.ok) {
				blocklist = blocklist.filter((b) => b.id !== id);
			} else {
				const j = await res.json().catch(() => ({}));
				error = j.error ?? 'Failed to remove artist';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to remove artist';
		}
	}
</script>

{#if !data.user}
	<p>Log in to manage your blocklist.</p>
	<button
				class="primary"
				type="button"
				onclick={async () => {
					await authClient.signIn.social({ provider: 'spotify', callbackURL: '/blocklist' });
				}}
			>
				Log in with Spotify
			</button>
{:else}
	<h1 style="margin-top: 0;">Blocklist</h1>
	<p style="color: var(--text-muted); margin-bottom: 1rem;">
		Artists in this list will never appear in AI-generated playlists.
	</p>
	{#if loading}
		<p style="color: var(--text-muted);">Loading…</p>
	{:else if error}
		<p style="color: var(--danger);">{error}</p>
	{:else}
		<section style="margin-bottom: 2rem;">
			<h2 style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 0.5rem;">Add artist</h2>
			<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search for an artist…"
					style="max-width: 280px;"
					onkeydown={(e) => e.key === 'Enter' && searchArtists()}
				/>
				<button type="button" class="primary" onclick={searchArtists} disabled={searchLoading || searchQuery.trim().length < 2}>
					{searchLoading ? 'Searching…' : 'Search'}
				</button>
			</div>
			{#if addError}
				<p style="color: var(--danger); font-size: 0.9rem; margin-top: 0.5rem;">{addError}</p>
			{/if}
			{#if searchResults.length > 0}
				<ul style="list-style: none; padding: 0; margin: 0.5rem 0 0 0;">
					{#each searchResults as artist}
						{@const alreadyBlocked = blocklist.some((b) => b.spotifyArtistId === artist.id)}
						<li class="list-card" style="margin-bottom: 0.35rem;">
							<span class="main">{artist.name}</span>
							{#if alreadyBlocked}
								<span style="color: var(--text-muted); font-size: 0.85rem;">In blocklist</span>
							{:else}
								<button type="button" class="danger" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onclick={() => addToBlocklist(artist)}>Add to blocklist</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
		<section>
			<h2 style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 0.5rem;">Blocked artists</h2>
			{#if blocklist.length === 0}
				<p style="color: var(--text-muted);">No artists blocked yet. Search above to add one.</p>
			{:else}
				<ul style="list-style: none; padding: 0; margin: 0;">
					{#each blocklist as artist}
						<li class="card" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
							<span>{artist.name}</span>
							<button type="button" class="danger" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;" onclick={() => remove(artist.id)}>Remove</button>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
{/if}
