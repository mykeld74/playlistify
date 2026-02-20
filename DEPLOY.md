# Deploy Playlistify to Netlify

## 1. Connect the repo

In [Netlify](https://app.netlify.com): **Add new site → Import an existing project**, connect your Git provider, and select the Playlistify repo. Netlify will use the `netlify.toml` in the repo for build settings.

## 2. Environment variables

In the Netlify site: **Site configuration → Environment variables**, add:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `SPOTIFY_CLIENT_ID` | From [Spotify Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard |
| `SPOTIFY_REDIRECT_URI` | `https://YOUR-SITE-NAME.netlify.app/auth/spotify/callback` (see below) |
| `SESSION_SECRET` | A long random string (e.g. `openssl rand -hex 32`) |
| `ANTHROPIC_API_KEY` | Optional; for AI playlist generation |

**Important:** Set `SPOTIFY_REDIRECT_URI` to your **live** Netlify URL, e.g.:

- `https://your-app-name.netlify.app/auth/spotify/callback`

No trailing slash. In the [Spotify app settings](https://developer.spotify.com/dashboard), add this exact URL under **Redirect URIs**.

## 3. Database

Ensure your Neon database has the schema applied. From your machine (with `DATABASE_URL` in `.env`):

```bash
pnpm db:migrate
```

## 4. Deploy

Push to the connected branch; Netlify will build and deploy. After the first deploy, open `https://YOUR-SITE-NAME.netlify.app` and log in with Spotify.
