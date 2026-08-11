import {
  BlobPreconditionFailedError,
  get,
  put,
} from "@vercel/blob";

export type RecentSetlist = {
  title: string;
  url: string;
  createdAt: string;
};

const HISTORY_PATH = "setlist-to-playlist/recent-setlists.json";
const MAX_RECENT_SETLISTS = 9;

export function isRecentSetlistsEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isRecentSetlist(value: unknown): value is RecentSetlist {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.title === "string" &&
    entry.title.length > 0 &&
    entry.title.length <= 220 &&
    typeof entry.url === "string" &&
    isSetlistUrl(entry.url) &&
    typeof entry.createdAt === "string" &&
    !Number.isNaN(Date.parse(entry.createdAt))
  );
}

export function isSetlistUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "setlist.fm" || url.hostname.endsWith(".setlist.fm"))
    );
  } catch {
    return false;
  }
}

async function readHistory() {
  const result = await get(HISTORY_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { entries: [] as RecentSetlist[], etag: undefined };
  }

  try {
    const data = JSON.parse(await new Response(result.stream).text());
    const entries = Array.isArray(data)
      ? data.filter(isRecentSetlist).slice(0, MAX_RECENT_SETLISTS)
      : [];
    return { entries, etag: result.blob.etag };
  } catch {
    return { entries: [] as RecentSetlist[], etag: result.blob.etag };
  }
}

export async function getRecentSetlists() {
  if (!isRecentSetlistsEnabled()) return [];
  try {
    return (await readHistory()).entries;
  } catch {
    return [];
  }
}

export async function addRecentSetlist(entry: RecentSetlist) {
  if (!isRecentSetlistsEnabled() || !isRecentSetlist(entry)) return null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { entries, etag } = await readHistory();
    const next = [entry, ...entries.filter((item) => item.url !== entry.url)].slice(
      0,
      MAX_RECENT_SETLISTS,
    );

    try {
      await put(HISTORY_PATH, JSON.stringify(next), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: "application/json",
        ...(etag ? { ifMatch: etag } : {}),
      });
      return next;
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError) || attempt === 2) {
        throw error;
      }
    }
  }

  return null;
}
