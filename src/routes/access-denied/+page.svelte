<script lang="ts">
	import { authClient } from '$lib/auth-client';
</script>

<svelte:head>
	<title>Access denied – Playlistify</title>
</svelte:head>

<div class="access-denied">
	<h1>Access denied</h1>
	<p>Your Spotify account is not on the allowlist for this app.</p>
	<button
		type="button"
		class="secondary"
		onclick={async () => {
			await authClient.signOut();
			window.location.href = '/';
		}}
	>
		Sign out and go home
	</button>
</div>

<style>
	.access-denied {
		text-align: center;
		padding: 2rem;
	}
	.access-denied h1 {
		margin-bottom: 0.5rem;
	}
	.access-denied p {
		color: var(--text-muted);
		margin-bottom: 1.5rem;
	}
</style>
