# Playlistify

Connect Spotify to view playlists, explore listening history, and create AI-style playlists from artists, tracks, and genres—with a blocklist so chosen artists never appear. Edit and name the playlist before uploading to Spotify.

## Features

- **Spotify OAuth** – Log in with your Spotify account
- **Dashboard** – View your existing playlists and recently played tracks
- **Blocklist** – Artists you never want in generated playlists (stored in DB)
- **Create Playlist** – Use seeds (artists, genres) and/or a text description; AI suggests songs, we resolve them on Spotify (blocklist applied), then you edit, name, and upload to Spotify
- **Drizzle + D1** – SQLite (Cloudflare D1) for users, sessions, and blocklist

## Setup

### 1. Spotify app

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Add a redirect URI: `http://127.0.0.1:4173/auth/spotify/callback` (for local; Spotify does not allow `localhost`) and your production URL (e.g. `https://your-app.pages.dev/auth/spotify/callback`).
3. Note the **Client ID** and **Client Secret**.

### 2. Cloudflare D1

1. Create a D1 database:
   ```bash
   pnpm wrangler d1 create playlistify-db
   ```
2. Copy the `database_id` from the output into `wrangler.jsonc` → `d1_databases[0].database_id` (replace `YOUR_D1_DATABASE_ID`).
3. Run migrations (local and remote):
   ```bash
   pnpm wrangler d1 execute playlistify-db --local --file=./drizzle/0000_even_midnight.sql
   pnpm wrangler d1 execute playlistify-db --remote --file=./drizzle/0000_even_midnight.sql
   ```

### 3. Environment / secrets

- **Local (wrangler):** Copy `.dev.vars.example` to `.dev.vars` and set:
  - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` (use `http://127.0.0.1:4173/auth/spotify/callback` — Spotify does not allow `localhost`)
  - `SESSION_SECRET` (long random string)
  - `ANTHROPIC_API_KEY` (for AI playlist generation; create one at [console.anthropic.com](https://console.anthropic.com/))
- **Production (Cloudflare Pages):** In the dashboard, set the same variables as **Environment variables** / **Secrets** for your Pages project. Also bind the same D1 database to the project (or use the same `wrangler.jsonc` in CI).

### 4. Run locally

- **Option A – Vite dev (no D1/OAuth):** `pnpm dev` — app runs but auth and DB won’t work.
- **Option B – Full stack (D1 + env):** build then run with wrangler so D1 and env are available:
  ```bash
  pnpm build
  pnpm preview
  ```
  Wrangler will use `.dev.vars` and the D1 binding from `wrangler.jsonc`. Redirect URI must match (e.g. `http://localhost:4173/auth/spotify/callback`).

## Scripts

- `pnpm dev` – Vite dev server (no D1 bindings)
- `pnpm build` – Production build (Cloudflare Pages)
- `pnpm preview` – Run built app with wrangler (D1 + `.dev.vars`)
- `pnpm db:generate` – Generate Drizzle migrations from schema changes

## Tech

- **SvelteKit 2** + **Svelte 5** (runes)
- **Cloudflare Pages** (adapter-cloudflare)
- **Drizzle ORM** + **Cloudflare D1** (SQLite)
- **Spotify Web API** (OAuth, playlists, recently played, search, create playlist)
- **Anthropic Claude** (claude-sonnet-4) for AI playlist suggestions, then Spotify Search to resolve tracks
