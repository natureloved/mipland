import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-16: JSON-RPC Query Methods";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Blocks 10 to 20 from the spec's pagination example, colored by page
// (target 100): 10-13, 14-18, 19-20.
const COUNTS = [40, 0, 55, 30, 12, 0, 0, 70, 25, 8, 60];
const PAGE = [0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2];
const COLORS = ["#2a7d6a", "#6da396", "#3b7dd8"];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8f6f3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            fontWeight: 500,
            color: "#2a7d6a",
            fontFamily: "monospace",
            letterSpacing: "2px",
            marginBottom: "16px",
          }}
        >
          MIP-16
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "#1a1714",
            letterSpacing: "-1px",
            marginBottom: "40px",
          }}
        >
          JSON-RPC Query Methods
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "160px", marginBottom: "32px" }}>
          {COUNTS.map((count, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: "52px",
                height: `${Math.max(6, (count / 70) * 160)}px`,
                borderRadius: "6px 6px 0 0",
                background: COLORS[PAGE[i]],
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: "22px",
            color: "#6b6259",
          }}
        >
          filters · joins · block-aligned pages · draft
        </div>
      </div>
    ),
    { ...size }
  );
}
