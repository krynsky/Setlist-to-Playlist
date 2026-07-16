import { NextRequest, NextResponse } from "next/server";

const SETLIST_API = "https://api.setlist.fm/rest/1.0/search/setlists";

export async function GET(request: NextRequest) {
  const artistName = request.nextUrl.searchParams.get("artistName")?.trim();
  if (!artistName) {
    return NextResponse.json({ error: "Enter an artist or band name." }, { status: 400 });
  }

  const apiKey = process.env.SETLIST_FM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Setlist.fm is not configured yet. Add the API key, then restart the app." },
      { status: 503 },
    );
  }

  const url = new URL(SETLIST_API);
  url.searchParams.set("artistName", artistName);
  url.searchParams.set("p", "1");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || `Setlist.fm request failed (${response.status}).` },
        { status: response.status },
      );
    }
    return NextResponse.json({ setlists: data?.setlist ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Setlist.fm could not be reached. Try again in a moment." },
      { status: 502 },
    );
  }
}
