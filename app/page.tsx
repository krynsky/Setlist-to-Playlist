"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SetlistSong = {
  name: string;
  cover?: { name?: string };
};

type SetlistSet = {
  encore?: number;
  song?: SetlistSong[];
};

type Setlist = {
  id: string;
  eventDate: string;
  url: string;
  artist: { name: string };
  venue?: {
    name?: string;
    city?: { name?: string; country?: { name?: string } };
  };
  tour?: { name?: string };
  sets?: { set?: SetlistSet[] };
};

type Song = {
  id: string;
  name: string;
  searchArtist: string;
  encore: boolean;
};

type SpotifyTrack = {
  uri: string;
  name: string;
  artists: { name: string }[];
};

const TOKEN_KEY = "encore.spotify.token";
const REFRESH_KEY = "encore.spotify.refresh";
const EXPIRES_KEY = "encore.spotify.expires";
const VERIFIER_KEY = "encore.spotify.verifier";
const SPOTIFY_API = "https://api.spotify.com/v1";

function formatDate(value: string) {
  const [day, month, year] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function venueLabel(setlist: Setlist) {
  return [
    setlist.venue?.name,
    setlist.venue?.city?.name,
    setlist.venue?.city?.country?.name,
  ]
    .filter(Boolean)
    .join(" · ");
}

function setlistTitle(setlist: Setlist) {
  const location = [setlist.venue?.city?.name, setlist.venue?.name]
    .filter(Boolean)
    .join(" · ");
  return [setlist.artist.name, location, formatDate(setlist.eventDate)]
    .filter(Boolean)
    .join(" — ");
}

function songsFromSetlist(setlist: Setlist): Song[] {
  return (setlist.sets?.set ?? []).flatMap((set, setIndex) =>
    (set.song ?? []).map((song, songIndex) => ({
      id: `${setIndex}-${songIndex}-${song.name}`,
      name: song.name,
      searchArtist: song.cover?.name || setlist.artist.name,
      encore: Boolean(set.encore),
    })),
  );
}

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hash(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

function hasSpotifySession() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

function clearSpotifySession() {
  [TOKEN_KEY, REFRESH_KEY, EXPIRES_KEY, VERIFIER_KEY].forEach((key) =>
    localStorage.removeItem(key),
  );
}

async function beginSpotifyLogin(clientId: string | null) {
  if (!clientId) {
    throw new Error("Spotify is not configured yet. Add the client ID, then restart the app.");
  }

  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(64)));
  localStorage.setItem(VERIFIER_KEY, verifier);
  const redirectUri = `${window.location.origin}${window.location.pathname}`;
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: base64Url(await hash(verifier)),
    scope: "playlist-modify-public playlist-modify-private",
    show_dialog: "true",
  });
  window.location.assign(`https://accounts.spotify.com/authorize?${query}`);
}

async function exchangeSpotifyCode(code: string, clientId: string | null) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier || !clientId) {
    throw new Error("The Spotify sign-in could not be verified. Please connect again.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: `${window.location.origin}${window.location.pathname}`,
  });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || "Spotify sign-in failed.");
  }
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + data.expires_in * 1000));
  localStorage.removeItem(VERIFIER_KEY);
}

async function spotifyAccessToken(clientId: string | null) {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = Number(localStorage.getItem(EXPIRES_KEY));
  if (token && expires > Date.now() + 30_000) return token;

  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken || !clientId) {
    clearSpotifySession();
    throw new Error("Your Spotify session expired. Connect Spotify again.");
  }
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    clearSpotifySession();
    throw new Error("Your Spotify session expired. Connect Spotify again.");
  }
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.access_token as string;
}

async function spotifyRequest(
  path: string,
  options: RequestInit = {},
  clientId: string | null,
) {
  const response = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${await spotifyAccessToken(clientId)}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) clearSpotifySession();
    throw new Error(data?.error?.message || `Spotify request failed (${response.status}).`);
  }
  return data;
}

async function findSpotifyTrack(
  song: Song,
  clientId: string | null,
): Promise<SpotifyTrack | null> {
  const query = new URLSearchParams({
    q: `track:${song.name} artist:${song.searchArtist}`,
    type: "track",
    limit: "1",
  });
  const result = await spotifyRequest(`/search?${query}`, {}, clientId);
  return result.tracks?.items?.[0] ?? null;
}

async function applySpotifyPlaylistVisibility(
  playlistId: string,
  isPublic: boolean,
  clientId: string | null,
) {
  await spotifyRequest(`/playlists/${playlistId}`, {
    method: "PUT",
    body: JSON.stringify({ public: isPublic }),
  }, clientId);
}

export default function Home() {
  const [artist, setArtist] = useState("");
  const [city, setCity] = useState("");
  const [year, setYear] = useState("");
  const [results, setResults] = useState<Setlist[]>([]);
  const [selected, setSelected] = useState<Setlist | null>(null);
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [spotifyClientId, setSpotifyClientId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState<{
    url: string;
    added: number;
    unmatched: string[];
    isPublic: boolean;
    visibilityWarning: string;
  } | null>(null);

  const songs = useMemo(
    () => (selected ? songsFromSetlist(selected) : []),
    [selected],
  );

  useEffect(() => {
    async function initializeSpotify() {
      const configResponse = await fetch("/api/config");
      const config = await configResponse.json();
      const clientId = config.spotifyClientId || null;
      setSpotifyClientId(clientId);
      setConnected(hasSpotifySession());
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const authError = params.get("error");
      if (authError) {
        setStatus("Spotify connection was cancelled.");
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
      if (!code) return;

      setStatus("Finishing Spotify connection…");
      try {
        await exchangeSpotifyCode(code, clientId);
        setConnected(true);
        setStatus("Spotify connected. Choose a show to create your playlist.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Spotify sign-in failed.");
      } finally {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    void initializeSpotify();
  }, []);

  function chooseSetlist(setlist: Setlist) {
    const nextSongs = songsFromSetlist(setlist);
    setSelected(setlist);
    setIncluded(new Set(nextSongs.map((song) => song.id)));
    setSuccess(null);
    setStatus(`${nextSongs.length} songs in this setlist.`);
  }

  async function searchSetlists(event: FormEvent) {
    event.preventDefault();
    const search = {
      artistName: artist.trim(),
      cityName: city.trim(),
      year: year.trim(),
    };
    if (!search.artistName && !search.cityName && !search.year) {
      setStatus("Enter an artist, city, or year to search.");
      return;
    }
    if (search.year && !/^\d{4}$/.test(search.year)) {
      setStatus("Enter the year as four digits, such as 2024.");
      return;
    }
    setBusy(true);
    setSelected(null);
    setSuccess(null);
    setStatus("Looking for shows…");
    try {
      const params = new URLSearchParams();
      Object.entries(search).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const response = await fetch(`/api/setlists?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Setlist search failed.");
      setResults(data.setlists);
      setStatus(
        data.setlists.length
          ? `${data.setlists.length} shows found.`
          : "No shows found. Try broadening your search.",
      );
    } catch (error) {
      setResults([]);
      setStatus(error instanceof Error ? error.message : "Setlist search failed.");
    } finally {
      setBusy(false);
    }
  }

  async function connectOrDisconnect() {
    if (connected) {
      clearSpotifySession();
      setConnected(false);
      setStatus("Spotify disconnected.");
      return;
    }
    try {
      await beginSpotifyLogin(spotifyClientId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Spotify connection failed.");
    }
  }

  async function createSpotifyPlaylist() {
    if (!selected) return;
    if (!connected) {
      await connectOrDisconnect();
      return;
    }
    const chosenSongs = songs.filter((song) => included.has(song.id));
    if (!chosenSongs.length) {
      setStatus("Select at least one song for the playlist.");
      return;
    }

    setBusy(true);
    setSuccess(null);
    try {
      const matches: { song: Song; track: SpotifyTrack | null }[] = [];
      for (let index = 0; index < chosenSongs.length; index += 1) {
        setStatus(`Matching song ${index + 1} of ${chosenSongs.length} on Spotify…`);
        matches.push({
          song: chosenSongs[index],
          track: await findSpotifyTrack(chosenSongs[index], spotifyClientId),
        });
      }

      const uris = matches.flatMap(({ track }) => (track ? [track.uri] : []));
      const unmatched = matches
        .filter(({ track }) => !track)
        .map(({ song }) => song.name);
      if (!uris.length) throw new Error("Spotify could not match any selected songs.");

      setStatus(`Creating a playlist with ${uris.length} songs…`);
      const playlist = await spotifyRequest("/me/playlists", {
        method: "POST",
        body: JSON.stringify({
          name: setlistTitle(selected),
          description: `Setlist from ${venueLabel(selected)}. Created with Encore.`,
          public: isPublic,
        }),
      }, spotifyClientId);

      for (let index = 0; index < uris.length; index += 100) {
        await spotifyRequest(`/playlists/${playlist.id}/items`, {
          method: "POST",
          body: JSON.stringify({ uris: uris.slice(index, index + 100) }),
        }, spotifyClientId);
      }

      let visibilityWarning = "";
      setStatus(`Applying ${isPublic ? "public" : "private"} playlist visibility…`);
      try {
        await applySpotifyPlaylistVisibility(playlist.id, isPublic, spotifyClientId);
      } catch {
        visibilityWarning =
          "Spotify added the songs but could not apply the visibility setting. You can change it in Spotify.";
      }

      setSuccess({
        url: playlist.external_urls.spotify,
        added: uris.length,
        unmatched,
        isPublic,
        visibilityWarning,
      });
      setStatus(
        visibilityWarning || `${isPublic ? "Public" : "Private"} playlist created.`,
      );
    } catch (error) {
      setConnected(hasSpotifySession());
      setStatus(error instanceof Error ? error.message : "Playlist creation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">FROM THE STAGE TO YOUR LIBRARY</p>
        <h1 id="hero-title">Setlist to Playlist</h1>
        <p className="intro">
          Find any show on Setlist.fm and turn the night&apos;s songs into a
          Spotify playlist, in the order they were played.
        </p>
        <form className="search" onSubmit={searchSetlists}>
          <div className="search-fields">
            <label className="search-field" htmlFor="artist-search">
              <span>Artist</span>
              <input
                id="artist-search"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
                placeholder="Radiohead"
                autoComplete="off"
              />
            </label>
            <label className="search-field" htmlFor="city-search">
              <span>City</span>
              <input
                id="city-search"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Los Angeles"
                autoComplete="address-level2"
              />
            </label>
            <label className="search-field year-field" htmlFor="year-search">
              <span>Year</span>
              <input
                id="year-search"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2024"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
              />
            </label>
          </div>
          <button disabled={busy} type="submit">
            {busy ? "Working…" : "Find setlists"} <span>→</span>
          </button>
        </form>
        <button className="spotify-button" onClick={connectOrDisconnect}>
          <span aria-hidden="true">●</span>
          {connected ? "Spotify connected" : "Connect Spotify"}
        </button>
        <p className="helper">Use any combination of artist, city, and year</p>
      </section>

      <section className="workspace" aria-label="Setlist playlist builder">
        <div className="results-panel">
          <div className="section-title">
            <span>01</span>
            <h2>Select a show</h2>
          </div>
          {results.length === 0 ? (
            <div className="empty-state">Your concert search results will appear here.</div>
          ) : (
            <div className="show-list">
              {results.map((setlist) => {
                const [day, month] = setlist.eventDate.split("-");
                return (
                  <button
                    className={`show-card ${selected?.id === setlist.id ? "active" : ""}`}
                    key={setlist.id}
                    onClick={() => chooseSetlist(setlist)}
                    aria-pressed={selected?.id === setlist.id}
                  >
                    <span className="show-date">
                      <b>{day}</b>
                      <small>{month}</small>
                    </span>
                    <span className="show-copy">
                      <strong>{setlist.artist.name}</strong>
                      <small>{venueLabel(setlist)}</small>
                    </span>
                    <span className="show-arrow" aria-hidden="true">↗</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="playlist-panel">
          <div className="section-title">
            <span>02</span>
            <h2>Build your playlist</h2>
          </div>
          {!selected ? (
            <div className="empty-state playlist-empty">
              <span className="record" aria-hidden="true">♫</span>
              Select a show to preview its songs.
            </div>
          ) : (
            <>
              <header className="selected-show">
                <div>
                  <p className="eyebrow">Selected setlist</p>
                  <h3>{setlistTitle(selected)}</h3>
                </div>
                <a href={selected.url} target="_blank" rel="noreferrer">
                  View setlist ↗
                </a>
              </header>
              {songs.length ? (
                <ol className="song-list">
                  {songs.map((song, index) => (
                    <li key={song.id}>
                      <input
                        aria-label={`Include ${song.name}`}
                        type="checkbox"
                        checked={included.has(song.id)}
                        onChange={() =>
                          setIncluded((current) => {
                            const next = new Set(current);
                            if (next.has(song.id)) next.delete(song.id);
                            else next.add(song.id);
                            return next;
                          })
                        }
                      />
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{song.name}</strong>
                      {song.searchArtist !== selected.artist.name && <em>cover</em>}
                      {song.encore && <em>encore</em>}
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="no-songs">This setlist does not have songs yet.</div>
              )}
              <div className="create-row">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                  />
                  Make playlist public
                </label>
                <button
                  className="create-button"
                  disabled={busy || !songs.length}
                  onClick={createSpotifyPlaylist}
                >
                  {connected ? "Create Spotify playlist" : "Connect Spotify to create"} →
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="status" role="status" aria-live="polite">
        {status || "Ready to find a show."}
      </div>

      {success && (
        <aside className="success" aria-label="Playlist created">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Your playlist is ready</strong>
            <p>
              {success.isPublic ? "Public" : "Private"} · {success.added} songs added
              {success.unmatched.length
                ? ` · ${success.unmatched.length} unmatched: ${success.unmatched.join(", ")}`
                : ""}
              {success.visibilityWarning ? ` · ${success.visibilityWarning}` : ""}
            </p>
          </div>
          <a href={success.url} target="_blank" rel="noreferrer">
            Open in Spotify ↗
          </a>
        </aside>
      )}

      <footer>
        Powered by Setlist.fm and Spotify · Your Spotify login stays between you
        and Spotify.
      </footer>
      <p className="creator-credit">
        Created by <a href="https://krynsky.com/">Mark Krynsky</a>
      </p>
    </main>
  );
}
