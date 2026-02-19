# Desktop app (Electron)

Run Playlistify as a local desktop app: one command to build, start the server, and open a window.

## Quick start

1. **From the project folder** (with `.env` already set up):
   ```bash
   pnpm run desktop
   ```
   This builds the app, starts the server on **port 3847**, and opens the Playlistify window.

2. **Spotify redirect URI**  
   For the desktop app, add this in your [Spotify app settings](https://developer.spotify.com/dashboard):
   - `http://127.0.0.1:3847/auth/spotify/callback`  
   In `.env` set:
   ```env
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3847/auth/spotify/callback
   ```
   (You can have both 5173 and 3847 as redirect URIs in Spotify and switch `SPOTIFY_REDIRECT_URI` in `.env` depending on whether you use `pnpm dev` or `pnpm run desktop`.)

## Packaged app (double‑click to open)

Build a standalone app (e.g. macOS `.app` or `.dmg`):

```bash
pnpm run dist
```

Output is in the `dist/` folder (e.g. `dist/mac/Playlistify.app`).

- **Node required:** The packaged app runs the server with `node`, so Node must be installed and on your `PATH` when you open the app.
- **Config for the packaged app:**  
  Copy your `.env` to the app’s config directory so the packaged app can find it:
  - **macOS:** `~/Library/Application Support/Playlistify/.env`  
  Create the folder if needed:
  ```bash
  mkdir -p ~/Library/Application\ Support/Playlistify
  cp .env ~/Library/Application\ Support/Playlistify/
  ```
  Use `SPOTIFY_REDIRECT_URI=http://127.0.0.1:3847/auth/spotify/callback` in that `.env`.

Then double‑click `Playlistify.app` (or open the app from the built `.dmg`).
