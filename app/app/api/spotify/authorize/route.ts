import { NextRequest, NextResponse } from "next/server";
import { isLoopbackHost } from "@/lib/local-settings";
import { createSpotifyAuthorization, savePendingSpotifyAuth } from "@/lib/local-spotify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isLoopbackHost(request.headers.get("host"))) return new NextResponse(null, { status: 404 });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) return new NextResponse("Spotify is not configured yet.", { status: 503 });

  const redirectUri = new URL("/api/spotify/callback", `http://127.0.0.1:${request.nextUrl.port}`).toString();
  const authorization = createSpotifyAuthorization(redirectUri);
  await savePendingSpotifyAuth({
    state: authorization.state,
    verifier: authorization.verifier,
    redirectUri,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const query = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: authorization.challenge,
    scope: "playlist-modify-public playlist-modify-private",
    show_dialog: "true",
    state: authorization.state,
  });
  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${query}`);
}
