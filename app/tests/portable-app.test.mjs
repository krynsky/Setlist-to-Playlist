import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the portable app requires user-owned credentials and keeps demo analytics opt-in", async () => {
  const [layout, env, route, config] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../app/api/setlists/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/config/route.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /cloudflareinsights|data-cf-beacon/);
  assert.match(layout, /process\.env\.DEMO_GOATCOUNTER_URL/);
  assert.match(layout, /\{goatCounterUrl && \(/);
  assert.doesNotMatch(env, /^DEMO_GOATCOUNTER_URL=/m);
  assert.match(env, /^SETLIST_FM_API_KEY=$/m);
  assert.match(env, /^SPOTIFY_CLIENT_ID=$/m);
  assert.match(route, /process\.env\.SETLIST_FM_API_KEY/);
  assert.match(route, /"x-api-key": apiKey/);
  assert.doesNotMatch(config, /setlistFmApiKey:/);
});

test("the UI still creates a playlist with the requested visibility after tracks are added", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const addSongs = source.indexOf("for (let index = 0; index < uris.length; index += 100)");
  const applyVisibility = source.indexOf("await applySpotifyPlaylistVisibility(");
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

test("the Pinokio launcher captures its localhost URL and opens it inside Pinokio", async () => {
  const [launcher, start] = await Promise.all([
    readFile(new URL("../../pinokio.js", import.meta.url), "utf8"),
    readFile(new URL("../../start.js", import.meta.url), "utf8"),
  ]);
  assert.match(start, /\[0-9a-zA-Z\.:-\]\+/);
  assert.match(start, /url: "\{\{input\.event\[1\]\}\}"/);
  assert.match(start, /https\?/);
  assert.match(launcher, /text: "Open Web UI"/);
  assert.match(launcher, /href: local\.url/);
  assert.doesNotMatch(launcher, /target: "_blank"/);
});

test("local settings are loopback-only and save credentials without exposing them", async () => {
  const [page, form, route, config, home, launcher] = await Promise.all([
    readFile(new URL("../app/settings/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/settings/settings-form.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/settings/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/config/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../pinokio.js", import.meta.url), "utf8"),
  ]);
  assert.match(page, /isLoopbackHost/);
  assert.match(route, /isLocalRequest/);
  assert.match(route, /status: 404/);
  assert.match(route, /writeFile\(environmentFile/);
  assert.match(route, /SETLIST_FM_API_KEY/);
  assert.match(route, /SPOTIFY_CLIENT_ID/);
  assert.doesNotMatch(route, /setlistFmApiKey: setlistFmApiKey/);
  assert.match(config, /settingsAvailable/);
  assert.match(home, /Open local settings/);
  assert.match(form, /Restart the app/);
  assert.match(launcher, /Settings & API keys/);
});

test("local Spotify authorization reconnects the Pinokio Web UI after browser sign-in", async () => {
  const [page, config, authorize, callback, session, gitignore, settings] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/config/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/spotify/authorize/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/spotify/callback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/spotify/session/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
    readFile(new URL("../app/settings/settings-form.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(config, /localSpotifyAuth/);
  assert.match(authorize, /\/api\/spotify\/callback/);
  assert.match(authorize, /savePendingSpotifyAuth/);
  assert.match(callback, /saveLocalSpotifySession/);
  assert.match(session, /refresh_token/);
  assert.match(session, /clearLocalSpotifySession/);
  assert.match(page, /window\.open\("\/api\/spotify\/authorize"/);
  assert.match(page, /Finish connecting Spotify in the browser/);
  assert.match(page, /Local settings/);
  assert.match(settings, /\/api\/spotify\/callback/);
  assert.match(gitignore, /^\.spotify-\*\.json$/m);
});

test("the demo exposes complete discovery metadata and a social share image", async () => {
  const [layout, ogImage, robots, sitemap, llms] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/opengraph-image.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/llms.txt", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /metadataBase: new URL\(siteUrl\)/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
  assert.match(layout, /application\/ld\+json/);
  assert.match(layout, /"@type": "WebApplication"/);
  assert.match(ogImage, /ImageResponse/);
  assert.match(ogImage, /width: 1200/);
  assert.match(ogImage, /height: 630/);
  assert.match(robots, /sitemap/);
  assert.match(sitemap, /setlist-to-playlist\.krynsky\.com/);
  assert.match(llms, /Spotify playlists/);
  assert.doesNotMatch(llms, /SETLIST_FM_API_KEY=|SPOTIFY_CLIENT_ID=/);
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
