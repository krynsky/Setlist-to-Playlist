import { NextRequest, NextResponse } from "next/server";
import { isLoopbackHost } from "@/lib/local-settings";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || null,
    isConfigured: Boolean(process.env.SETLIST_FM_API_KEY && process.env.SPOTIFY_CLIENT_ID),
    settingsAvailable: isLoopbackHost(request.headers.get("host")),
  });
}
