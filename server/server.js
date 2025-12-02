require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are not set. OAuth will not work until they are provided.');
}

// In-memory store for tokens by state (for demo / small deployments).
const tokensByState = {};

function generateState() {
  return Math.random().toString(36).substring(2, 12);
}

app.get('/login', (req, res) => {
  const state = req.query.state || generateState();
  const scope = [
    'user-read-email',
    'user-read-private',
    'playlist-modify-private',
    'playlist-modify-public'
  ].join(' ');

  if (!SPOTIFY_REDIRECT_URI || !CLIENT_ID) {
    return res.status(500).send('Server not configured: missing SPOTIFY_REDIRECT_URI or SPOTIFY_CLIENT_ID');
  }

  const authorizeUrl = 'https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    '&client_id=' + encodeURIComponent(CLIENT_ID) +
    '&scope=' + encodeURIComponent(scope) +
    '&redirect_uri=' + encodeURIComponent(SPOTIFY_REDIRECT_URI) +
    '&state=' + encodeURIComponent(state) +
    '&show_dialog=true';

  // Redirect user to Spotify's authorization page
  // Debug: log the authorize URL (without secrets)
  try {
    console.log('[DEBUG] /login -> authorizeUrl:', authorizeUrl);
  } catch (e) {
    console.warn('[DEBUG] failed to log authorizeUrl', e);
  }
  res.redirect(authorizeUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const error = req.query.error;

  // Debug: log incoming query params
  console.log('[DEBUG] /callback hit. query:', req.query);

  if (error) {
    // Redirect back to frontend with error
    const url = `${FRONTEND_URL}/#/spotify-connect?error=${encodeURIComponent(error)}&state=${encodeURIComponent(state||'')}`;
    return res.redirect(url);
  }

  if (!code) {
    const url = `${FRONTEND_URL}/#/spotify-connect?error=no_code&state=${encodeURIComponent(state||'')}`;
    return res.redirect(url);
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    });

    // Attempt to parse token response and log it for debugging
    let tokenJson;
    try {
      tokenJson = await tokenRes.json();
    } catch (parseErr) {
      console.error('[DEBUG] Failed to parse token response JSON', parseErr);
      console.error('[DEBUG] tokenRes status:', tokenRes.status, 'statusText:', tokenRes.statusText);
      const url = `${FRONTEND_URL}/#/spotify-connect?error=token_exchange_failed&state=${encodeURIComponent(state||'')}`;
      return res.redirect(url);
    }

    // Debug: log full token response (may contain access_token)
    console.log('[DEBUG] token exchange response status:', tokenRes.status, 'body:', tokenJson);

    if (!tokenRes.ok) {
      console.error('Token exchange failed', tokenJson);
      const url = `${FRONTEND_URL}/#/spotify-connect?error=token_exchange_failed&state=${encodeURIComponent(state||'')}`;
      return res.redirect(url);
    }

    // Save tokens by state
    tokensByState[state] = {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      expires_in: tokenJson.expires_in,
      obtained_at: Date.now()
    };

    // Redirect back to frontend and include hasTokens so front-end can detect
    const url = `${FRONTEND_URL}/#/spotify-connect?hasTokens=true&state=${encodeURIComponent(state)}`;
    return res.redirect(url);
  } catch (err) {
    console.error('Callback error', err);
    const url = `${FRONTEND_URL}/#/spotify-connect?error=server_error&state=${encodeURIComponent(state||'')}`;
    return res.redirect(url);
  }
});

// Simple endpoint to provide mock recommendations or real ones if token available
app.post('/api/spotify/recommendations', async (req, res) => {
  const state = req.body.state;
  // If we have a stored token we could call Spotify's recommendations API.
  // For now return a small mock list (the frontend falls back to mock too).

  const mock = [
    { id: 'mock1', uri: 'spotify:track:mock1', name: 'City Lights', artist: 'Analog Dreams', album: 'Neon Nights', duration_ms: 222000, image: '' },
    { id: 'mock2', uri: 'spotify:track:mock2', name: 'Morning Glow', artist: 'Golden Hour', album: 'Sunrise Stories', duration_ms: 245000, image: '' }
  ];

  res.json({ tracks: mock });
});

// Create a playlist on behalf of the user (mocked). If tokens exist for the state, you
// could implement real creation by calling Spotify Web API using the stored access_token.
app.post('/api/spotify/create-playlist', (req, res) => {
  const state = req.body.state;
  const playlistName = req.body.playlistName || 'SoundtrackGen Playlist';
  const trackUris = req.body.trackUris || [];

  // For demo return a mocked playlist response
  const id = 'pl_' + Math.random().toString(36).substring(2, 10);
  const playlistUrl = `https://open.spotify.com/playlist/${id}`;

  return res.json({ playlistId: id, playlistUrl: playlistUrl });
});

app.post('/api/spotify/logout', (req, res) => {
  const state = req.body.state;
  if (state && tokensByState[state]) delete tokensByState[state];
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SoundtrackGen backend listening on port ${PORT}`));
