import { pgTable, text, serial, timestamp, boolean } from 'drizzle-orm/pg-core';

// Better Auth core tables (https://www.better-auth.com/docs/concepts/database)
export const betterAuthUser = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('emailVerified').notNull(),
	image: text('image'),
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull(),
});

export const betterAuthSession = pgTable('session', {
	id: text('id').primaryKey(),
	token: text('token').notNull(),
	expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	userId: text('userId')
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: 'cascade' }),
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
});

export const betterAuthAccount = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	userId: text('userId')
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: 'cascade' }),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	idToken: text('idToken'),
	expiresAt: timestamp('expiresAt', { withTimezone: true }),
	accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
	scope: text('scope'),
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
	password: text('password'),
});

export const betterAuthVerification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
	createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
});

export const blockedArtists = pgTable('blocked_artists', {
	id: serial('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => betterAuthUser.id, { onDelete: 'cascade' }),
	spotifyArtistId: text('spotify_artist_id').notNull(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof betterAuthUser.$inferSelect;
export type BlockedArtist = typeof blockedArtists.$inferSelect;
