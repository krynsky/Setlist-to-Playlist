import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isLoopbackHost } from "@/lib/local-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const environmentFile = path.join(process.cwd(), ".env.local");

function isLocalRequest(request: NextRequest) {
  return isLoopbackHost(request.headers.get("host"));
}

function updateEnvironmentValue(contents: string, key: string, value: string) {
  const expression = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (expression.test(contents)) return contents.replace(expression, line);
  return `${contents.replace(/\s*$/, "\n")}${line}\n`;
}

function hasValidSetlistKey(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{20,200}$/.test(value.trim());
}

function hasValidSpotifyClientId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9]{32}$/.test(value.trim());
}

export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) return new NextResponse(null, { status: 404 });

  return NextResponse.json({
    hasSetlistFmApiKey: Boolean(process.env.SETLIST_FM_API_KEY),
    hasSpotifyClientId: Boolean(process.env.SPOTIFY_CLIENT_ID),
  });
}

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) return new NextResponse(null, { status: 404 });

  const body = await request.json().catch(() => null);
  const setlistFmApiKey = body?.setlistFmApiKey?.trim();
  const spotifyClientId = body?.spotifyClientId?.trim();

  if (!hasValidSetlistKey(setlistFmApiKey) || !hasValidSpotifyClientId(spotifyClientId)) {
    return NextResponse.json(
      { error: "Enter a valid Setlist.fm API key and 32-character Spotify Client ID." },
      { status: 400 },
    );
  }

  const existing = await readFile(environmentFile, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const withSetlistKey = updateEnvironmentValue(existing, "SETLIST_FM_API_KEY", setlistFmApiKey);
  const updated = updateEnvironmentValue(withSetlistKey, "SPOTIFY_CLIENT_ID", spotifyClientId);

  await writeFile(environmentFile, updated, { encoding: "utf8", mode: 0o600 });
  return NextResponse.json({ saved: true });
}
