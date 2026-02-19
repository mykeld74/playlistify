<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
</svelte:head>

<nav>
	<a href="/" class="brand">Playlistify</a>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		{#if data.user}
			<a href="/">Dashboard</a>
			<a href="/blocklist">Blocklist</a>
			<a href="/create">Create Playlist</a>
			<span style="color: var(--text-muted); font-size: 0.9rem;">{data.user.displayName ?? 'User'}</span>
			<form action="/auth/logout" method="POST" style="display: inline;">
				<button type="submit" class="secondary" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">Log out</button>
			</form>
		{:else}
			<a href="/auth/spotify">Log in with Spotify</a>
		{/if}
	</div>
</nav>

<main style="max-width: 960px; margin: 0 auto; padding: 1.5rem;">
	{@render children()}
</main>
