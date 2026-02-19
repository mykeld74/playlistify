import { env as dynamicEnv } from '$env/dynamic/private';

export interface Env {
	DATABASE_URL?: string;
	SPOTIFY_CLIENT_ID?: string;
	SPOTIFY_CLIENT_SECRET?: string;
	SPOTIFY_REDIRECT_URI?: string;
	SESSION_SECRET?: string;
	ANTHROPIC_API_KEY?: string;
}

export function getEnv(): Env {
	return {
		DATABASE_URL: dynamicEnv.DATABASE_URL,
		SPOTIFY_CLIENT_ID: dynamicEnv.SPOTIFY_CLIENT_ID,
		SPOTIFY_CLIENT_SECRET: dynamicEnv.SPOTIFY_CLIENT_SECRET,
		SPOTIFY_REDIRECT_URI: dynamicEnv.SPOTIFY_REDIRECT_URI,
		SESSION_SECRET: dynamicEnv.SESSION_SECRET,
		ANTHROPIC_API_KEY: dynamicEnv.ANTHROPIC_API_KEY,
	};
}
