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
  assert.match(source, /\[setlist\.artist\.name, formatDate\(setlist\.eventDate\), location\]/);
  assert.match(source, /Created with https:\/\/setlist-to-playlist\.krynsky\.com/);
});

test("the site and Pinokio launcher share the same favicon artwork", async () => {
  const [layout, metadata, siteIcon, launcherIcon] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../pinokio.json", import.meta.url), "utf8"),
    readFile(new URL("../public/favicon.svg", import.meta.url), "utf8"),
    readFile(new URL("../../icon.svg", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /icon: "\/favicon\.svg"/);
  assert.equal(JSON.parse(metadata).icon, "icon.svg");
  assert.equal(siteIcon, launcherIcon);
});

test("recent setlists are optional and limited to nine shared entries", async () => {
  const [page, route, storage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/recent-setlists/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/recent-setlists.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Recently turned into playlists/);
  assert.ok(
    page.indexOf('{success &&') < page.indexOf('<section className="recent-setlists"'),
    "the shared history section should remain visible outside the playlist-success condition",
  );
  assert.match(page, /The latest setlists turned into playlists will appear here/);
  assert.match(route, /isRecentSetlistsEnabled/);
  assert.doesNotMatch(route, /SETLIST_API/);
  assert.match(route, /body\?\.setlist/);
  assert.match(route, /setlist\.artist\?\.name,\s*date,\s*\[setlist\.venue/);
  assert.match(page, /setlist: selected/);
  assert.match(page, /ok && Array\.isArray\(data\?\.entries\)/);
  assert.match(storage, /const MAX_RECENT_SETLISTS = 9/);
  assert.match(storage, /process\.env\.BLOB_READ_WRITE_TOKEN/);
  assert.doesNotMatch(storage, /ifMatch/);
});
