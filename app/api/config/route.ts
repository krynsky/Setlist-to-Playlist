import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID || null,
  });
}
