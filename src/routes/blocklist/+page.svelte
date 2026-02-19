<script lang="ts">
	let { data } = $props();

	let blocklist = $state<{ id: number; name: string; spotifyArtistId: string }[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

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

	async function remove(id: number) {
		const res = await fetch(`/api/blocklist/${id}`, { method: 'DELETE' });
		if (res.ok) {
			blocklist = blocklist.filter((b) => b.id !== id);
		}
	}
</script>

{#if !data.user}
	<p>Log in to manage your blocklist.</p>
	<a href="/auth/spotify"><button class="primary">Log in with Spotify</button></a>
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
		<ul style="list-style: none; padding: 0; margin: 0 0 2rem 0;">
			{#each blocklist as artist}
				<li class="card" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
					<span>{artist.name}</span>
					<button type="button" class="danger" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;" onclick={() => remove(artist.id)}>Remove</button>
				</li>
			{/each}
		</ul>
		<p style="color: var(--text-muted); font-size: 0.9rem;">Add artists from the Create Playlist flow when searching for seeds.</p>
	{/if}
{/if}
