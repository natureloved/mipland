import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-10: Deterministic RaptorCast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = ["#2a7d6a", "#c4653a", "#3b7dd8", "#8a5cc2", "#a8841a", "#d0537a", "#5b8c2a", "#6b6259"];
// 28 chunks dealt round-robin over 8 validators, then 4 zero leaves.
const CELLS = Array.from({ length: 32 }, (_, i) => (i < 28 ? COLORS[i % COLORS.length] : null));

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
          MIP-10
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
          Deterministic RaptorCast
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", width: "736px", gap: "8px", marginBottom: "32px" }}>
          {CELLS.map((color, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                width: "38px",
                height: "38px",
                borderRadius: "6px",
                background: color ?? "#ffffff",
                border: color ? "none" : "2px dashed #e2ddd6",
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
          one root per block · chunk owners from a public seed · draft
        </div>
      </div>
    ),
    { ...size }
  );
}
