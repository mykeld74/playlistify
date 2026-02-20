import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { getDb } from '$lib/db';
import { getEnv } from '$lib/env';
import * as schema from '$lib/db/schema';

export const auth = betterAuth({
	database: drizzleAdapter(getDb(), {
		provider: 'pg',
		schema: {
			user: schema.betterAuthUser,
			session: schema.betterAuthSession,
			account: schema.betterAuthAccount,
			verification: schema.betterAuthVerification,
		},
	}),
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['spotify'],
		},
	},
	socialProviders: {
		spotify: {
			clientId: getEnv().SPOTIFY_CLIENT_ID!,
			clientSecret: getEnv().SPOTIFY_CLIENT_SECRET!,
			scope: [
				'user-read-email',
				'playlist-read-private',
				'playlist-read-collaborative',
				'playlist-modify-public',
				'playlist-modify-private',
			],
		},
	},
	secret: getEnv().SESSION_SECRET!,
	basePath: '/api/auth',
	baseURL: getEnv().BETTER_AUTH_BASE_URL ?? getEnv().SITE_URL,
	plugins: [sveltekitCookies(getRequestEvent)],
});
