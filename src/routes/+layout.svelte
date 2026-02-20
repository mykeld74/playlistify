<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authClient } from '$lib/auth-client';

	let { data, children } = $props();
	import logo from '$lib/assets/logo.svg';
</script>

<svelte:head>
	<title>Playlistify</title>
	<meta name="description" content="Create AI-powered Spotify playlists with a blocklist." />
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<nav>
	<a href="/" class="brand"
		><div class="homeLink">
			<span class="logoContainer"><img src={logo} alt="Playlistify logo" /></span>Playlistify
		</div></a
	>
	<div style="display: flex; align-items: center; gap: 0.5rem;">
		{#if data.user}
			<a href="/">Dashboard</a>
			<a href="/blocklist">Blocklist</a>
			<a href="/create">Create Playlist</a>
			<span style="color: var(--text-muted); font-size: 0.9rem;"
				>{data.user.displayName ?? 'User'}</span
			>
			<button
				type="button"
				class="secondary"
				style="padding: 0.35rem 0.75rem; font-size: 0.85rem;"
				onclick={async () => {
					await authClient.signOut();
					window.location.href = '/';
				}}
			>
				Log out
			</button>
		{:else}
			<button
				type="button"
				class="primary"
				onclick={async () => {
					await authClient.signIn.social({ provider: 'spotify', callbackURL: '/' });
				}}
			>
				Log in with Spotify
			</button>
		{/if}
	</div>
</nav>

<main style="max-width: 960px; margin: 0 auto; padding: 1.5rem;">
	{@render children()}
</main>

<style>
	.logoContainer {
		width: 24px;
		height: 24px;
		margin-right: 0.5rem;
		display: inline-block;
		img {
			width: 100%;
			height: auto;
		}
	}
	.homeLink {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
