import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the portable app requires user-owned credentials and no hosted analytics token", async () => {
  const [layout, env, route, config] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../app/api/setlists/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/config/route.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /cloudflareinsights|data-cf-beacon/);
  assert.match(env, /^SETLIST_FM_API_KEY=$/m);
  assert.match(env, /^SPOTIFY_CLIENT_ID=$/m);
  assert.match(route, /process\.env\.SETLIST_FM_API_KEY/);
  assert.match(route, /"x-api-key": apiKey/);
  assert.doesNotMatch(config, /SETLIST_FM_API_KEY/);
});

test("the UI still creates a playlist with the requested visibility after tracks are added", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const addSongs = source.indexOf("for (let index = 0; index < uris.length; index += 100)");
  const applyVisibility = source.indexOf("await applySpotifyPlaylistVisibility(playlist.id, isPublic, spotifyClientId)");
  assert.ok(addSongs >= 0 && addSongs < applyVisibility);
  assert.match(source, /name: setlistTitle\(selected\)/);
});
