# SoundtrackGen backend

Minimal Node/Express backend to handle Spotify OAuth and provide simple API endpoints the frontend expects.

Environment variables (see `.env.example`):

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI` (must match exactly the Redirect URI registered in Spotify Developer Dashboard)
- `FRONTEND_URL` (where to redirect the browser after successful OAuth; example: `http://localhost:5500`)

Run locally:

```bash
cd server
npm install
cp .env.example .env
# edit .env with your credentials
npm start
```

Deploy to Render:
- Add the repository as a service on Render
- Set environment variables on Render (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, FRONTEND_URL)
- Deploy
