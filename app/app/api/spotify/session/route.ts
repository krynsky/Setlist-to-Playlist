import { NextRequest, NextResponse } from "next/server";
import { isLoopbackHost } from "@/lib/local-settings";
import {
  clearLocalSpotifySession,
  readLocalSpotifySession,
  saveLocalSpotifySession,
} from "@/lib/local-spotify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function notFoundUnlessLocal(request: NextRequest) {
  return isLoopbackHost(request.headers.get("host"));
}

export async function GET(request: NextRequest) {
  if (!notFoundUnlessLocal(request)) return new NextResponse(null, { status: 404 });

  const session = await readLocalSpotifySession();
  if (!session) return NextResponse.json({ connected: false });
  if (session.expiresAt > Date.now() + 30_000) {
    return NextResponse.json({ connected: true, accessToken: session.accessToken });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!session.refreshToken || !clientId) {
    await clearLocalSpotifySession();
    return NextResponse.json({ connected: false });
  }
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    await clearLocalSpotifySession();
    return NextResponse.json({ connected: false });
  }

  const refreshed = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || session.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  await saveLocalSpotifySession(refreshed);
  return NextResponse.json({ connected: true, accessToken: refreshed.accessToken });
}

export async function DELETE(request: NextRequest) {
  if (!notFoundUnlessLocal(request)) return new NextResponse(null, { status: 404 });
  await clearLocalSpotifySession();
  return NextResponse.json({ connected: false });
}
