export type SpotifyTrack = {
  uri: string;
  name: string;
  artists: { name: string }[];
};

type SearchTracks = (title: string, artist: string) => Promise<SpotifyTrack[]>;

function normalizedTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\bgotta\b/g, "got to")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function matches(track: SpotifyTrack, title: string, artist: string) {
  return normalizedTitle(track.name) === normalizedTitle(title)
    && track.artists.some((credit) => credit.name.toLowerCase() === artist.toLowerCase());
}

export async function findSpotifyTrack(
  title: string,
  concertArtist: string,
  originalArtist: string,
  search: SearchTracks,
): Promise<SpotifyTrack | null> {
  const isCover = originalArtist.toLowerCase() !== concertArtist.toLowerCase();
  if (!isCover) return (await search(title, concertArtist))[0] ?? null;

  const concertTitles = [title];
  if (/\bgot to\b/i.test(title)) {
    concertTitles.push(title.replace(/\bgot to\b/i, "Gotta"));
  }

  for (const concertTitle of concertTitles) {
    const found = (await search(concertTitle, concertArtist))
      .find((track) => matches(track, title, concertArtist));
    if (found) return found;
  }

  return (await search(title, originalArtist))
    .find((track) => matches(track, title, originalArtist)) ?? null;
}
