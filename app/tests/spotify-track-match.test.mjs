import assert from "node:assert/strict";
import test from "node:test";
import { findSpotifyTrack } from "../lib/spotify-track-match.ts";

function track(name, artist, uri = `${artist}:${name}`) {
  return { name, uri, artists: [{ name: artist }] };
}

test("covers prefer a matching recording by the concert artist", async () => {
  const searched = [];
  const match = await findSpotifyTrack(
    "Old Man", "Beck", "Neil Young",
    async (title, artist) => {
      searched.push([title, artist]);
      return [track("Old Man", "Beck")];
    },
  );
  assert.equal(match?.uri, "Beck:Old Man");
  assert.deepEqual(searched, [["Old Man", "Beck"]]);
});

test("covers fall back to the original artist only after checking the concert artist", async () => {
  const searched = [];
  const match = await findSpotifyTrack(
    "Old Man", "Beck", "Neil Young",
    async (title, artist) => {
      searched.push([title, artist]);
      return artist === "Beck" ? [] : [track("Old Man", "Neil Young")];
    },
  );
  assert.equal(match?.uri, "Neil Young:Old Man");
  assert.deepEqual(searched, [["Old Man", "Beck"], ["Old Man", "Neil Young"]]);
});

test("a different song by the concert artist does not block the cover fallback", async () => {
  const searched = [];
  const match = await findSpotifyTrack(
    "Old Man", "Beck", "Neil Young",
    async (title, artist) => {
      searched.push([title, artist]);
      return artist === "Beck"
        ? [track("Old Man", "Another Artist"), track("Old Man Blues", "Beck")]
        : [track("Old Man", "Neil Young")];
    },
  );
  assert.equal(match?.uri, "Neil Young:Old Man");
  assert.deepEqual(searched, [["Old Man", "Beck"], ["Old Man", "Neil Young"]]);
});

test("Got to in a setlist matches Gotta in the concert artist's Spotify title", async () => {
  const searched = [];
  const match = await findSpotifyTrack(
    "Everybody's Got to Learn Sometime", "Beck", "The Korgis",
    async (title, artist) => {
      searched.push([title, artist]);
      return title.includes("Gotta")
        ? [track("Everybody's Gotta Learn Sometime", "Beck")]
        : [];
    },
  );
  assert.equal(match?.uri, "Beck:Everybody's Gotta Learn Sometime");
  assert.deepEqual(searched, [
    ["Everybody's Got to Learn Sometime", "Beck"],
    ["Everybody's Gotta Learn Sometime", "Beck"],
  ]);
});

test("ordinary songs use the concert artist search once", async () => {
  const searched = [];
  await findSpotifyTrack("Loser", "Beck", "Beck", async (title, artist) => {
    searched.push([title, artist]);
    return [];
  });
  assert.deepEqual(searched, [["Loser", "Beck"]]);
});

test("covers with matching titles but no concert artist recording use the original", async () => {
  const searched = [];
  const match = await findSpotifyTrack(
    "True Love Will Find You in the End", "Beck", "Daniel Johnston",
    async (title, artist) => {
      searched.push([title, artist]);
      return artist === "Beck" ? [] : [track(title, artist)];
    },
  );
  assert.equal(match?.uri, "Daniel Johnston:True Love Will Find You in the End");
  assert.deepEqual(searched, [
    ["True Love Will Find You in the End", "Beck"],
    ["True Love Will Find You in the End", "Daniel Johnston"],
  ]);
});
