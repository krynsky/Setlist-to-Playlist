import { ImageResponse } from "next/og";

export const alt = "Setlist to Playlist concert setlist and Spotify playlist builder";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d1530 0%, #18264c 100%)",
          color: "#f5f2e9",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "58px 70px 52px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#c8ff3d",
            display: "flex",
            fontFamily: "monospace",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: 3,
          }}
        >
          FROM THE STAGE TO YOUR LIBRARY
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Georgia, serif",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1,
            marginTop: 18,
          }}
        >
          Setlist to Playlist
        </div>
        <div
          style={{
            color: "#c5cee2",
            display: "flex",
            fontFamily: "Arial, sans-serif",
            fontSize: 25,
            marginTop: 18,
          }}
        >
          Turn any concert setlist into a Spotify playlist.
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 42,
            width: "100%",
          }}
        >
          <div
            style={{
              background: "#f5f2e9",
              borderRadius: 8,
              color: "#111a3a",
              display: "flex",
              flex: 1,
              fontFamily: "Arial, sans-serif",
              height: 72,
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingLeft: 20 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5 }}>ARTIST</span>
              <span style={{ fontSize: 18, marginTop: 4 }}>Radiohead</span>
            </div>
            <div style={{ borderLeft: "1px solid #d6d2c9", display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingLeft: 20 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5 }}>CITY</span>
              <span style={{ fontSize: 18, marginTop: 4 }}>Los Angeles</span>
            </div>
            <div style={{ borderLeft: "1px solid #d6d2c9", display: "flex", flexDirection: "column", flex: 0.55, justifyContent: "center", paddingLeft: 20 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: 1.5 }}>YEAR</span>
              <span style={{ fontSize: 18, marginTop: 4 }}>2024</span>
            </div>
            <div style={{ alignItems: "center", background: "#d97757", color: "#fffaf0", display: "flex", fontSize: 18, fontWeight: 700, justifyContent: "center", width: 172 }}>
              Find setlists →
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 26, width: "100%" }}>
          <div style={{ border: "1px solid #405178", display: "flex", flex: 1, flexDirection: "column", height: 154, padding: 21 }}>
            <div style={{ color: "#c8ff3d", display: "flex", fontFamily: "monospace", fontSize: 15, letterSpacing: 1.5 }}>01  SELECT A SHOW</div>
            <div style={{ border: "1px dashed #405178", color: "#93a3c1", display: "flex", flex: 1, fontFamily: "Arial, sans-serif", fontSize: 18, justifyContent: "center", alignItems: "center", marginTop: 16 }}>
              Concert search results
            </div>
          </div>
          <div style={{ border: "1px solid #405178", display: "flex", flex: 1, flexDirection: "column", height: 154, padding: 21 }}>
            <div style={{ color: "#c8ff3d", display: "flex", fontFamily: "monospace", fontSize: 15, letterSpacing: 1.5 }}>02  BUILD YOUR PLAYLIST</div>
            <div style={{ border: "1px dashed #405178", color: "#93a3c1", display: "flex", flex: 1, fontFamily: "Arial, sans-serif", fontSize: 18, justifyContent: "center", alignItems: "center", marginTop: 16 }}>
              Songs in performance order
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
