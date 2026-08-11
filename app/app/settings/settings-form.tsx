"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type SettingsStatus = {
  hasSetlistFmApiKey: boolean;
  hasSpotifyClientId: boolean;
};

export function SettingsForm() {
  const [setlistFmApiKey, setSetlistFmApiKey] = useState("");
  const [spotifyClientId, setSpotifyClientId] = useState("");
  const [configured, setConfigured] = useState<SettingsStatus | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => {
        setRedirectUri(`${window.location.origin}/api/spotify/callback`);
        return response.json();
      })
      .then((data) => setConfigured(data))
      .catch(() => setStatus("Settings are available only from a local installation."));
  }, []);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setStatus("");
    setBusy(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setlistFmApiKey, spotifyClientId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save your settings.");
      setSetlistFmApiKey("");
      setSpotifyClientId("");
      setConfigured({ hasSetlistFmApiKey: true, hasSpotifyClientId: true });
      setStatus("Saved to app/.env.local. Restart the app, then return here or open the Web UI.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save your settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ol className="setup-steps">
        <li>
          Create a <a href="https://www.setlist.fm/settings/api" target="_blank" rel="noreferrer">Setlist.fm API key</a>.
        </li>
        <li>
          Create a <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Spotify app</a>, then copy its Client ID. No Spotify client secret is needed.
        </li>
        <li>
          In your Spotify app, add this exact Redirect URI: <code>{redirectUri || "http://localhost:3000/api/spotify/callback"}</code>
        </li>
      </ol>

      <form className="settings-form" onSubmit={saveSettings}>
        <label>
          <span>Setlist.fm API key {configured?.hasSetlistFmApiKey ? "(currently configured)" : ""}</span>
          <input
            value={setlistFmApiKey}
            onChange={(event) => setSetlistFmApiKey(event.target.value)}
            autoComplete="off"
            required
            type="password"
          />
        </label>
        <label>
          <span>Spotify Client ID {configured?.hasSpotifyClientId ? "(currently configured)" : ""}</span>
          <input
            value={spotifyClientId}
            onChange={(event) => setSpotifyClientId(event.target.value)}
            autoComplete="off"
            required
            type="password"
          />
        </label>
        <button disabled={busy} type="submit">{busy ? "Saving…" : "Save local settings"}</button>
      </form>

      <p className="settings-status" role="status">{status}</p>
      <p className="settings-note">Your keys are saved only in this local installation and are never added to the GitHub repository.</p>
      <Link className="settings-back" href="/">← Back to Setlist to Playlist</Link>
    </>
  );
}
