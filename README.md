# Encore — Setlist to Spotify

Encore searches Setlist.fm for a concert, preserves the performed song order, matches each song on Spotify, and creates a playlist in the signed-in listener's account.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Create a [Setlist.fm API key](https://www.setlist.fm/settings/api) and set `SETLIST_FM_API_KEY`.
3. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), set `SPOTIFY_CLIENT_ID`, and add the local URL printed by `npm run dev` as an allowed Redirect URI.
4. Run `npm install`, then `npm run dev`.

Spotify login uses Authorization Code with PKCE. The client ID is public by design; no Spotify client secret is used. Setlist.fm requests run through the server route so its API key is not exposed in browser code.

## API behavior

- Setlist search uses `GET /rest/1.0/search/setlists` with Setlist.fm's required `x-api-key` header.
- Playlist creation uses Spotify's `POST /me/playlists` endpoint.
- Matched tracks are added in setlist order with `POST /playlists/{playlist_id}/items`, in batches of 100.
- Cover songs are searched using the credited cover artist when Setlist.fm supplies one.

Setlist.fm's API is free for non-commercial projects under its terms.
