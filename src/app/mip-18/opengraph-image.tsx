import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-18: Call Stack Introspection Opcodes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FRAMES = [
  { label: "F0  CALLERN(2) = ORIGIN", highlight: false },
  { label: "F1  CALLERN(1)", highlight: true },
  { label: "F2  CALLERN(0) = CALLER", highlight: false },
];

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
          MIP-18
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
          Call Stack Introspection Opcodes
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          {FRAMES.map((f) => (
            <div
              key={f.label}
              style={{
                display: "flex",
                width: "560px",
                padding: "14px 24px",
                borderRadius: "12px",
                fontFamily: "monospace",
                fontSize: "26px",
                border: f.highlight ? "2px solid #2a7d6a" : "2px solid #e2ddd6",
                background: f.highlight ? "#e6f2ee" : "#ffffff",
                color: f.highlight ? "#2a7d6a" : "#6b6259",
              }}
            >
              {f.label}
            </div>
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
          0xAE 0x00 CALLSTACKDEPTH · 0xAE 0x01 CALLERN · in review
        </div>
      </div>
    ),
    { ...size }
  );
}
