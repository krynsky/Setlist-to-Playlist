import { NextRequest, NextResponse } from "next/server";
import {
  addRecentSetlist,
  getRecentSetlists,
  isRecentSetlistsEnabled,
} from "../../../lib/recent-setlists";

const SETLIST_API = "https://api.setlist.fm/rest/1.0/setlist";

type SetlistRecord = {
  eventDate?: string;
  url?: string;
  artist?: { name?: string };
  venue?: { name?: string; city?: { name?: string } };
};

function titleForSetlist(setlist: SetlistRecord) {
  const [day, month, year] = (setlist.eventDate ?? "").split("-").map(Number);
  const date =
    day && month && year
      ? new Intl.DateTimeFormat("en", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(new Date(year, month - 1, day))
      : "";
  return [
    setlist.artist?.name,
    date,
    [setlist.venue?.city?.name, setlist.venue?.name].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join(" - ");
}

export async function GET() {
  const enabled = isRecentSetlistsEnabled();
  return NextResponse.json({
    enabled,
    entries: enabled ? await getRecentSetlists() : [],
  });
}

export async function POST(request: NextRequest) {
  if (!isRecentSetlistsEnabled()) {
    return NextResponse.json({ entries: [] }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const setlistId = typeof body?.setlistId === "string" ? body.setlistId.trim() : "";
  if (!/^[a-z0-9-]{8,}$/i.test(setlistId)) {
    return NextResponse.json({ error: "Invalid setlist." }, { status: 400 });
  }

  try {
    const apiKey = process.env.SETLIST_FM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Setlist.fm is not configured." }, { status: 503 });
    }
    const response = await fetch(`${SETLIST_API}/${encodeURIComponent(setlistId)}`, {
      headers: { Accept: "application/json", "x-api-key": apiKey },
      cache: "no-store",
    });
    const setlist = (await response.json().catch(() => null)) as SetlistRecord | null;
    const title = setlist ? titleForSetlist(setlist) : "";
    if (!response.ok || !title || !setlist?.url) {
      return NextResponse.json({ error: "Setlist could not be verified." }, { status: 400 });
    }
    const entries = await addRecentSetlist({
      title,
      url: setlist.url,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ entries: entries ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Could not update recent setlists." },
      { status: 502 },
    );
  }
}
