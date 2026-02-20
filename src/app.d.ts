// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session, User } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			session?: Session | null;
			user?: User | null;
			accessToken?: string | null;
			/** Spotify user ID (from account table) for API calls */
			spotifyUserId?: string | null;
		}
	}
}

export {};
