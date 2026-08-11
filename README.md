# Setlist to Playlist

Search Setlist.fm, choose a show, and create a Spotify playlist in setlist order. Every installation uses its own Setlist.fm key and Spotify app—no shared credentials are included.

## Run locally

Requires Node.js 20.9 or later.

1. `cd app`
2. Copy `.env.example` to `.env.local`.
3. Add your [Setlist.fm API key](https://www.setlist.fm/settings/api) as `SETLIST_FM_API_KEY`.
4. Create a Spotify app, add `http://localhost:3000/` as a Redirect URI, and set its client ID as `SPOTIFY_CLIENT_ID`.
5. Run `npm ci` and then `npm run dev`.

Spotify uses Authorization Code with PKCE, so no Spotify client secret is needed. The Setlist.fm key is used only by the server route and is never sent to the browser.

## Pinokio

Clone this repository into `PINOKIO_HOME/api/setlist-to-playlist`, open it in Pinokio, choose **Install**, then edit `app/.env.local` with your two values. Start the app and add the exact localhost URL shown by Pinokio as a Spotify Redirect URI.

## Deploy to Vercel

Import this repository into Vercel and set **Root Directory** to `app`. Add `SETLIST_FM_API_KEY` and `SPOTIFY_CLIENT_ID` in Vercel Environment Variables. Add your deployed URL, including the trailing slash, as a Redirect URI in your Spotify app.

## Development

From `app`, run `npm run lint` and `npm test`.
