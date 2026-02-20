import { env as dynamicEnv } from '$env/dynamic/private';

export interface Env {
	DATABASE_URL?: string;
	SPOTIFY_CLIENT_ID?: string;
	SPOTIFY_CLIENT_SECRET?: string;
	SPOTIFY_REDIRECT_URI?: string;
	SESSION_SECRET?: string;
	ANTHROPIC_API_KEY?: string;
	/** If set, only this Spotify user ID can access the app (allowlist). */
	ALLOWED_SPOTIFY_ID?: string;
	/** Full app URL for Better Auth callbacks/redirects (e.g. https://your-app.netlify.app or http://127.0.0.1:5173). */
	BETTER_AUTH_BASE_URL?: string;
	/** Alias for BETTER_AUTH_BASE_URL if you prefer. */
	SITE_URL?: string;
}

export function getEnv(): Env {
	return {
		DATABASE_URL: dynamicEnv.DATABASE_URL,
		SPOTIFY_CLIENT_ID: dynamicEnv.SPOTIFY_CLIENT_ID,
		SPOTIFY_CLIENT_SECRET: dynamicEnv.SPOTIFY_CLIENT_SECRET,
		SPOTIFY_REDIRECT_URI: dynamicEnv.SPOTIFY_REDIRECT_URI,
		SESSION_SECRET: dynamicEnv.SESSION_SECRET,
		ANTHROPIC_API_KEY: dynamicEnv.ANTHROPIC_API_KEY,
		ALLOWED_SPOTIFY_ID: dynamicEnv.ALLOWED_SPOTIFY_ID,
		BETTER_AUTH_BASE_URL: dynamicEnv.BETTER_AUTH_BASE_URL,
		SITE_URL: dynamicEnv.SITE_URL,
	};
}
