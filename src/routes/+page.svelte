<script lang="ts">
	import { untrack } from 'svelte';
	import { authClient } from '$lib/auth-client';

	let { data } = $props();

	type PlaylistItem = {
		name: string;
		id: string;
		external_urls?: { spotify?: string };
		tracks?: { total: number };
		description?: string;
	};

	let playlists = $state<PlaylistItem[]>([]);
	let loading = $state(true);
	let fetchError = $state<string | null>(null);
	let actionError = $state<string | null>(null);
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editDescription = $state('');
	let editSaving = $state(false);
	let deleteConfirmId = $state<string | null>(null);
	let deleteLoading = $state(false);

	async function fetchDashboard() {
		loading = true;
		fetchError = null;
		try {
			const pRes = await fetch('/api/playlists', { cache: 'no-store' });
			const pData = pRes.ok ? (await pRes.json()) : null;
			playlists = (pData?.items ?? []) as PlaylistItem[];
		} catch (e) {
			fetchError = e instanceof Error ? e.message : 'Failed to load';
		} finally {
			loading = false;
		}
	}

	function startEdit(pl: PlaylistItem) {
		editingId = pl.id;
		editName = pl.name;
		editDescription = pl.description ?? '';
		deleteConfirmId = null;
		actionError = null;
	}

	function cancelEdit() {
		editingId = null;
		editName = '';
		editDescription = '';
		actionError = null;
	}

	async function saveEdit() {
		if (!editingId) return;
		const trimmedName = editName.trim();
		const trimmedDesc = editDescription.trim();
		if (!trimmedName) {
			actionError = 'Name cannot be empty';
			return;
		}
		editSaving = true;
		actionError = null;
		try {
			const payload: { name?: string; description?: string } = { name: trimmedName };
			if (trimmedDesc) payload.description = trimmedDesc;

			const res = await fetch(`/api/playlist/${encodeURIComponent(editingId)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (res.ok) {
				const savedId = editingId;
				playlists = playlists.map((p) =>
					p.id === savedId
						? { ...p, name: trimmedName, description: trimmedDesc || p.description }
						: p,
				);
				cancelEdit();
			} else {
				const j = await res.json().catch(() => ({ error: 'Failed to update playlist' }));
				actionError = j.error ?? 'Failed to update playlist';
			}
		} catch (e) {
			actionError = e instanceof Error ? e.message : 'Failed to update playlist';
		} finally {
			editSaving = false;
		}
	}

	function confirmDelete(id: string) {
		deleteConfirmId = id;
		editingId = null;
		actionError = null;
	}

	function cancelDelete() {
		deleteConfirmId = null;
		actionError = null;
	}

	async function doDelete(id: string) {
		deleteLoading = true;
		actionError = null;
		try {
			const res = await fetch(`/api/playlist/${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (res.ok) {
				playlists = playlists.filter((p) => p.id !== id);
				deleteConfirmId = null;
			} else {
				const j = await res.json().catch(() => ({ error: 'Failed to remove playlist' }));
				actionError = j.error ?? 'Failed to remove playlist';
			}
		} catch (e) {
			actionError = e instanceof Error ? e.message : 'Failed to remove playlist';
		} finally {
			deleteLoading = false;
		}
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') cancelEdit();
	}

	$effect(() => {
		if (data.user) untrack(() => { fetchDashboard(); });
	});
</script>

<svelte:head>
	<title>Dashboard | Playlistify</title>
</svelte:head>

{#if !data.user}
	<div class="card" style="text-align: center; padding: 3rem;">
		<h1 style="margin-top: 0;">Welcome to Playlistify</h1>
		<p style="color: var(--text-muted); margin-bottom: 1.5rem;">
			Connect Spotify to view your playlists and create AI-powered playlists with a blocklist.
		</p>
		<button
			class="primary"
			type="button"
			onclick={async () => {
				await authClient.signIn.social({ provider: 'spotify', callbackURL: '/' });
			}}
		>
			Log in with Spotify
		</button>
		{#if data.error}
			<p style="color: var(--danger); margin-top: 1rem;">Error: {data.error}</p>
			{#if data.error === 'token_exchange_failed'}
				<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Check that the redirect URI in your Spotify app matches exactly (e.g. <code>http://127.0.0.1:5173/api/auth/callback/spotify</code>), no trailing slash. Use 127.0.0.1, not localhost.</p>
			{:else if data.error === 'db_setup'}
				<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Database tables are missing. Set <code>DATABASE_URL</code> in .env (Neon connection string), then run:</p>
				<pre style="background: var(--surface); padding: 0.75rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem;">pnpm db:migrate</pre>
			{/if}
		{/if}
	</div>
{:else}
	<h1 style="margin-top: 0;">Dashboard</h1>
	{#if loading}
		<p style="color: var(--text-muted);">Loading…</p>
	{:else if fetchError}
		<p style="color: var(--danger);">{fetchError}</p>
	{:else}
		{#if actionError}
			<p style="color: var(--danger); margin-bottom: 1rem;">{actionError}</p>
		{/if}
		<section style="margin-bottom: 2rem;">
			<h2 style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 0.75rem;">Your Playlists</h2>
			{#if playlists.length}
				<div class="playlist-grid">
					{#each playlists as pl (pl.id)}
						{#if editingId === pl.id}
							<form
								class="playlist-card"
								style="border-color: var(--accent);"
								onsubmit={(e) => { e.preventDefault(); saveEdit(); }}
							>
								<label for="edit-name" style="font-size: 0.85rem; font-weight: 600;">Name</label>
								<input id="edit-name" type="text" bind:value={editName} placeholder="Playlist name" required onkeydown={handleEditKeydown} />
								<label for="edit-desc" style="font-size: 0.85rem; font-weight: 600;">Description (optional)</label>
								<input id="edit-desc" type="text" bind:value={editDescription} placeholder="Description" onkeydown={handleEditKeydown} />
								<div class="card-actions">
									<button type="submit" class="primary" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save'}</button>
									<button type="button" class="secondary" onclick={cancelEdit} disabled={editSaving}>Cancel</button>
								</div>
							</form>
						{:else if deleteConfirmId === pl.id}
							<div class="playlist-card" style="border-color: var(--danger);">
								<p class="card-title">Remove "{pl.name}"?</p>
								<p class="card-meta">This removes the playlist from your Spotify library.</p>
								<div class="card-actions">
									<button type="button" class="danger" onclick={() => doDelete(pl.id)} disabled={deleteLoading}>{deleteLoading ? 'Removing…' : 'Remove'}</button>
									<button type="button" class="secondary" onclick={cancelDelete} disabled={deleteLoading}>Cancel</button>
								</div>
							</div>
						{:else}
							<div class="playlist-card">
								<div class="card-body">
									<span class="card-title">{pl.name}</span>
									<span class="card-meta">{pl.tracks?.total ?? 0} tracks</span>
								</div>
								<div class="card-actions">
									<button type="button" class="secondary" onclick={() => startEdit(pl)}>Edit</button>
									<button type="button" class="danger" onclick={() => confirmDelete(pl.id)}>Remove</button>
									<a class="btn-link secondary" href={pl.external_urls?.spotify ?? '#'} target="_blank" rel="noopener noreferrer">Open in Spotify</a>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<p style="color: var(--text-muted);">No playlists yet.</p>
			{/if}
		</section>
	{/if}
{/if}
