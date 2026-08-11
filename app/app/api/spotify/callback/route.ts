import { NextRequest, NextResponse } from "next/server";
import { isLoopbackHost } from "@/lib/local-settings";
import { saveLocalSpotifySession, takePendingSpotifyAuth } from "@/lib/local-spotify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function completionPage(message: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Setlist to Playlist</title></head><body style="margin:0;padding:48px;background:#111a31;color:#f4f1e9;font:16px system-ui"><h1 style="color:#d9ff63">${message}</h1><p>You can return to Setlist to Playlist in Pinokio.</p></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  if (!isLoopbackHost(request.headers.get("host"))) return new NextResponse(null, { status: 404 });

  const error = request.nextUrl.searchParams.get("error");
  if (error) return completionPage("Spotify connection was cancelled.", 400);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const pending = await takePendingSpotifyAuth();
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!code || !state || !clientId || !pending || pending.state !== state) {
    return completionPage("Spotify connection could not be verified. Return to Pinokio and try again.", 400);
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code,
      code_verifier: pending.verifier,
      redirect_uri: pending.redirectUri,
    }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    return completionPage(data?.error_description || "Spotify connection failed. Return to Pinokio and try again.", 400);
  }

  await saveLocalSpotifySession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return completionPage("Spotify connected.");
}
