import { eq } from 'drizzle-orm';
import type { Db } from '$lib/db';
import type { Env } from '$lib/env';
import { sessions } from '$lib/db/schema';
import { refreshAccessToken } from './spotify';

const SESSION_COOKIE = 'playlistify_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const STATE_COOKIE = 'playlistify_oauth_state';

function secureCompare(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let out = 0;
	for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return out === 0;
}

function sign(value: string, secret: string): string {
	// Simple HMAC-like sign using Web Crypto would be better; for now use a hash of value+secret
	const data = value + '.' + secret;
	let h = 0;
	for (let i = 0; i < data.length; i++) {
		const c = data.charCodeAt(i);
		h = (h << 5) - h + c;
		h = h & h;
	}
	return h.toString(36);
}

export function setStateCookie(value: string, secret: string): string {
	const signature = sign(value, secret);
	return `${value}.${signature}`;
}

export function verifyStateCookie(cookie: string, secret: string): string | null {
	const dot = cookie.indexOf('.');
	if (dot === -1) return null;
	const value = cookie.slice(0, dot);
	const sig = cookie.slice(dot + 1);
	return secureCompare(sign(value, secret), sig) ? value : null;
}

export function getSessionIdFromCookie(cookieHeader: string | null, secret: string): string | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
	const raw = match?.[1];
	if (!raw) return null;
	const dot = raw.indexOf('.');
	if (dot === -1) return null;
	const sessionId = raw.slice(0, dot);
	const sig = raw.slice(dot + 1);
	return secureCompare(sign(sessionId, secret), sig) ? sessionId : null;
}

export function buildSessionCookie(sessionId: string, secret: string, maxAge: number, secure = false): string {
	const value = sessionId + '.' + sign(sessionId, secret);
	return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function getSessionCookieValue(sessionId: string, secret: string): string {
	return sessionId + '.' + sign(sessionId, secret);
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function getSession(
	db: Db,
	cookieHeader: string | null,
	secret: string,
): Promise<{ userId: string; accessToken: string } | null> {
	const sessionId = getSessionIdFromCookie(cookieHeader, secret);
	if (!sessionId) return null;

	const sessionList = await db.select().from(sessions).where(eq(sessions.id, sessionId));
	const session = sessionList[0] ?? null;
	if (!session) return null;

	const now = new Date();
	if (session.expiresAt <= now) {
		return null; // Caller should pass env and we'll refresh there
	}

	return { userId: session.userId, accessToken: session.accessToken };
}

export async function getSessionWithRefresh(
	db: Db,
	cookieHeader: string | null,
	secret: string,
	env: Env,
): Promise<{ userId: string; accessToken: string } | null> {
	const sessionId = getSessionIdFromCookie(cookieHeader, secret);
	if (!sessionId) return null;

	const sessionList = await db.select().from(sessions).where(eq(sessions.id, sessionId));
	const session = sessionList[0] ?? null;
	if (!session) return null;

	const now = new Date();
	if (session.expiresAt <= now) {
		try {
			const { accessToken, expiresIn } = await refreshAccessToken(env, session.refreshToken);
			const expiresAt = new Date(Date.now() + expiresIn * 1000);
			await db
				.update(sessions)
				.set({ accessToken, expiresAt })
				.where(eq(sessions.id, sessionId));
			return { userId: session.userId, accessToken };
		} catch {
			await db.delete(sessions).where(eq(sessions.id, sessionId));
			return null;
		}
	}

	return { userId: session.userId, accessToken: session.accessToken };
}

export async function createSession(
	db: Db,
	userId: string,
	accessToken: string,
	refreshToken: string,
	expiresInSeconds: number,
): Promise<string> {
	const id = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
	await db.insert(sessions).values({
		id,
		userId,
		accessToken,
		refreshToken,
		expiresAt,
	});
	return id;
}
