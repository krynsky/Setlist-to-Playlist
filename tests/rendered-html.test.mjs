import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function request(path) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("api-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "application/json" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Encore app shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Encore — Setlist to Spotify<\/title>/i);
  assert.match(html, /Keep the encore/);
  assert.match(html, /Find setlists/);
  assert.match(html, /Connect Spotify/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("setlist search validates input without calling the upstream API", async () => {
  const response = await request("/api/setlists");
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Enter an artist or band name." });
});

test("setlist search reports missing server configuration safely", async () => {
  const previous = process.env.SETLIST_FM_API_KEY;
  delete process.env.SETLIST_FM_API_KEY;
  try {
    const response = await request("/api/setlists?artistName=Radiohead");
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /not configured/i);
  } finally {
    if (previous) process.env.SETLIST_FM_API_KEY = previous;
  }
});

test("setlist search authenticates upstream and returns setlists", async () => {
  const previousKey = process.env.SETLIST_FM_API_KEY;
  const previousFetch = globalThis.fetch;
  const upstreamSetlist = {
    id: "73e2a6b1",
    eventDate: "12-07-2026",
    artist: { name: "Radiohead" },
    venue: { name: "Test Theatre" },
    sets: { set: [{ song: [{ name: "Everything in Its Right Place" }] }] },
  };
  let capturedRequest;
  process.env.SETLIST_FM_API_KEY = "test-setlist-key";
  globalThis.fetch = async (input, init) => {
    capturedRequest = { input: String(input), init };
    return Response.json({ setlist: [upstreamSetlist] });
  };

  try {
    const response = await request("/api/setlists?artistName=Radiohead");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { setlists: [upstreamSetlist] });
    const upstreamUrl = new URL(capturedRequest.input);
    assert.equal(upstreamUrl.origin, "https://api.setlist.fm");
    assert.equal(upstreamUrl.pathname, "/rest/1.0/search/setlists");
    assert.equal(upstreamUrl.searchParams.get("artistName"), "Radiohead");
    assert.equal(capturedRequest.init.headers["x-api-key"], "test-setlist-key");
    assert.equal(capturedRequest.init.headers.Accept, "application/json");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey) process.env.SETLIST_FM_API_KEY = previousKey;
    else delete process.env.SETLIST_FM_API_KEY;
  }
});
