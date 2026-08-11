import { NextRequest, NextResponse } from "next/server";
import {
  addRecentSetlist,
  getRecentSetlists,
  isRecentSetlistsEnabled,
  isSetlistUrl,
} from "../../../lib/recent-setlists";

type SetlistRecord = {
  eventDate?: string;
  url?: string;
  artist?: { name?: string };
  venue?: { name?: string; city?: { name?: string } };
};

function isSetlistRecord(value: unknown): value is SetlistRecord {
  if (!value || typeof value !== "object") return false;
  const setlist = value as SetlistRecord;
  return (
    typeof setlist.eventDate === "string" &&
    /^\d{2}-\d{2}-\d{4}$/.test(setlist.eventDate) &&
    typeof setlist.url === "string" &&
    isSetlistUrl(setlist.url) &&
    typeof setlist.artist?.name === "string" &&
    setlist.artist.name.trim().length > 0
  );
}

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
  const setlist = body?.setlist;
  if (!isSetlistRecord(setlist)) {
    return NextResponse.json({ error: "Invalid setlist." }, { status: 400 });
  }

  try {
    const title = titleForSetlist(setlist);
    const url = setlist.url;
    if (!title || !url) {
      return NextResponse.json({ error: "Invalid setlist." }, { status: 400 });
    }
    const entries = await addRecentSetlist({
      title,
      url,
      createdAt: new Date().toISOString(),
    });
    if (!entries) {
      return NextResponse.json({ error: "Could not update recent setlists." }, { status: 400 });
    }
    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Recent setlist update failed", error);
    return NextResponse.json(
      { error: "Could not update recent setlists." },
      { status: 502 },
    );
  }
}
