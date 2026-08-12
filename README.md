# Setlist to Playlist

A small web app that turns a concert setlist into a Spotify playlist, in the order the songs were played. Search Setlist.fm by artist, city, and year, choose a show, review its songs, and save the result to your own Spotify account.

- 🎵 Search real concert setlists by artist, city, and year
- 📋 Review the songs before creating a playlist, including covers and encores
- 🎧 Connect your own Spotify account with secure PKCE sign-in
- 🔒 Create private playlists by default, or choose to make one public
- 🕘 See up to nine recently converted Setlist.fm shows when shared history is enabled
- 🖥️ Run it in a browser, locally, or from Pinokio
- 🆓 Free and open source — bring your own Setlist.fm and Spotify credentials

**[Try the live demo →](https://setlist-to-playlist.krynsky.com/)**

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="150">](https://www.buymeacoffee.com/krynsky)

![Setlist to Playlist landing page](assets/landing-page.png)

---

## Table of Contents

- [What It Does](#-what-it-does)
- [How It Works](#how-it-works)
- [Configuration](#-configuration)
- [Run Locally](#-run-locally)
- [Pinokio](#-pinokio)
- [Deploy Your Own Copy](#-deploy-your-own-copy)
- [Optional Demo Services](#optional-demo-services)
- [Tech Stack](#-tech-stack)
- [Development](#-development)
- [Privacy and Security](#-privacy-and-security)
- [License](#-license)

---

## 🎵 What It Does

Setlist to Playlist helps you recreate the night in Spotify:

Step | What happens
--- | ---
1. Search | Find Setlist.fm shows using any combination of artist, city, and year.
2. Select | Choose a show and see its setlist, in performance order.
3. Review | Include or exclude individual songs before the playlist is created. Covers and encore songs are identified.
4. Create | The app matches the selected songs on Spotify, creates a playlist in your account, and adds the matches in order.

Playlist names use the format **Artist - Date - Location**. The playlist description links back to the live demo. Playlists are private unless you explicitly enable **Make playlist public**.

When a deployment has shared history enabled, the page can show the latest nine Setlist.fm pages that visitors turned into playlists. It never exposes Spotify playlist links, account information, or API credentials.

---

## How It Works

The app searches Setlist.fm through a server route so your Setlist.fm API key stays off the browser. Spotify sign-in uses Authorization Code with PKCE: Spotify authorizes the app directly in your browser, and no Spotify client secret is required.

Song matching searches Spotify by track title and artist. If Spotify cannot find a song, the finished playlist reports it as unmatched rather than silently adding a different track.

For local and Pinokio installations, Spotify sign-in opens in your regular browser. The local server safely keeps the completed session for that installation so the Pinokio Web UI reconnects automatically when you return.

---

## ⚙️ Configuration

Every installation needs its own API credentials.

1. Create a [Setlist.fm API key](https://www.setlist.fm/settings/api).
2. Create a [Spotify app](https://developer.spotify.com/dashboard) and copy its **Client ID**.
3. Add the correct Spotify Redirect URI for the way you will run the app:

   | Installation | Redirect URI to add in Spotify |
   | --- | --- |
   | Local development | `http://127.0.0.1:3000/api/spotify/callback` |
   | Pinokio | The exact `http://127.0.0.1:<port>/api/spotify/callback` URI shown by **Settings & API keys** after starting the app |
   | Your own public deployment | Your exact public app URL, including the trailing slash, for example `https://your-domain.example/` |

4. For a local or Pinokio installation, open **Local settings** at `/settings` to enter both values. The page writes the keys to `app/.env.local`, then asks you to restart the app. You can also create the file manually:

   ```env
   SETLIST_FM_API_KEY=your_setlist_fm_key
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   ```

`SETLIST_FM_API_KEY` is used only by the server. `SPOTIFY_CLIENT_ID` is intentionally available to the browser because Spotify identifies public OAuth apps by client ID.

> [!IMPORTANT]
> Spotify does not accept `localhost` for this local callback. Use the explicit `127.0.0.1` URI shown above. No HTTPS certificate or Spotify Client Secret is required for local or Pinokio use.

---

## 💻 Run Locally

### Prerequisites

- Node.js 22.13 or later
- A Setlist.fm API key and Spotify Client ID

### Commands

```bash
# Clone the repository
git clone https://github.com/krynsky/Setlist-to-Playlist.git
cd Setlist-to-Playlist

# Install and start the app
cd app
npm ci
npm run dev
```

Open `http://127.0.0.1:3000/`. On first launch, use the local setup banner to open **Local settings**, enter your credentials, and restart the app. Then connect Spotify and search for a show.

On Windows PowerShell, use this copy command instead:

```powershell
Copy-Item app/.env.example app/.env.local
```

The **Local settings** link remains available after setup if you need to replace either credential.

---

## 🧩 Pinokio

This repository includes a one-click [Pinokio](https://desktop.pinokio.co/docs/#/) launcher.

1. Clone the repository into `PINOKIO_HOME/api/setlist-to-playlist`.
2. Open **Setlist to Playlist** in Pinokio and choose **Install**.
3. Choose **Start**, then open **Settings & API keys**.
4. Add your Setlist.fm key and Spotify Client ID, then copy the exact `http://127.0.0.1:<port>/api/spotify/callback` URI shown there into your Spotify app.
5. Restart the app, then choose **Open Web UI**.

Spotify authentication opens in your normal browser and returns to the local callback. When you return to Pinokio, its Web UI detects the completed session automatically. If you create a playlist before the button redraws, the app still reuses the saved session rather than asking you to authenticate again.

The launcher also includes:

- **Update** — pulls the latest repository changes and refreshes npm dependencies. Stop and start the app afterward.
- **Reset dependencies** — rebuilds `node_modules` if an installation becomes unhealthy.
- **Configure API keys** — opens the local `.env.local` file directly.

Your `.env.local` credentials and local Spotify session files stay on your machine and are not committed by the launcher update.

---

## 🚀 Deploy Your Own Copy

This project is a Next.js app located in the `app` directory. Deploy that directory to any Node.js-compatible host, then configure:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SETLIST_FM_API_KEY` | Yes | Server-side access to the Setlist.fm API |
| `SPOTIFY_CLIENT_ID` | Yes | Spotify PKCE application identifier |
| `BLOB_READ_WRITE_TOKEN` | Optional | Enables the shared list of the nine most recently converted Setlist.fm pages on supported Vercel Blob deployments |

After deployment, add the deployed app’s root URL—with its trailing slash—to the Spotify app’s Redirect URIs. For example: `https://your-domain.example/`.

Do not add any real key to `.env.example`, commit `.env.local`, or expose the Setlist.fm key in client-side code.

---

## Optional Demo Services

The public demo at [setlist-to-playlist.krynsky.com](https://setlist-to-playlist.krynsky.com/) uses optional services that are not required for local or Pinokio use:

- **Vercel Blob** stores the shared, non-user-specific recent Setlist.fm history when `BLOB_READ_WRITE_TOKEN` is configured.
- **GoatCounter** analytics is enabled only when the deployment sets `DEMO_GOATCOUNTER_URL`. It is intentionally absent from `.env.example`, so local and Pinokio installations do not load the analytics script.

---

## 🧰 Tech Stack

Layer | Technology
--- | ---
Web app | Next.js 16, React 19, TypeScript
Setlist search | Setlist.fm REST API
Playlists and sign-in | Spotify Web API and Authorization Code with PKCE
Styling | Tailwind CSS
Local launcher | Pinokio

---

## 🛠️ Development

Run these commands from `app`:

```bash
# Check code quality
npm run lint

# Build and run the portable-app test suite
npm test

# Production build only
npm run build
```

### Project Structure

```text
app/
  app/
    api/          # Setlist.fm proxy, local settings, Spotify, and recent-history routes
    page.tsx      # Search, setlist selection, Spotify sign-in, playlist creation
  public/         # App icons and static assets
  tests/          # Portable-app build checks
assets/           # README images
install.js        # Pinokio install action
start.js          # Pinokio start action
reset.js          # Pinokio dependency reset action
update.js         # Pinokio update action
```

---

## 🔐 Privacy and Security

- Your Setlist.fm API key stays on the server route and is never sent to the browser.
- Spotify authentication happens directly with Spotify using PKCE; no Spotify client secret is stored or required.
- On public deployments, Spotify access and refresh tokens are stored in your browser's local storage for your own session.
- For a local or Pinokio installation, the local app server keeps the Spotify session in ignored `.spotify-session.json` and temporary `.spotify-auth.json` files so an external Spotify browser login can reconnect the embedded Web UI.
- The local settings page and local Spotify routes are available only from loopback addresses.
- Shared history stores only a Setlist.fm URL, display title, and timestamp; it never stores Spotify account or playlist data.
- The app creates playlists only in the Spotify account you authorize.

---

## 📄 License

[MIT](LICENSE)
