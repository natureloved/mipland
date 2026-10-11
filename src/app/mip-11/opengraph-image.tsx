import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-11: Automatic Priority Fee Distribution";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const box = (accent: boolean) => ({
  display: "flex",
  padding: "18px 28px",
  borderRadius: "12px",
  fontFamily: "monospace",
  fontSize: "28px",
  border: accent ? "2px solid #2a7d6a" : "2px solid #e2ddd6",
  background: accent ? "#e6f2ee" : "#ffffff",
  color: accent ? "#2a7d6a" : "#6b6259",
});

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
          MIP-11
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "#1a1714",
            letterSpacing: "-1px",
            marginBottom: "48px",
          }}
        >
          Automatic Priority Fee Distribution
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "40px" }}>
          <div style={box(false)}>priority fees</div>
          <div style={{ display: "flex", fontSize: "36px", color: "#9b9084" }}>→</div>
          <div style={box(false)}>0xfee5…fee5</div>
          <div style={{ display: "flex", fontSize: "36px", color: "#9b9084" }}>→</div>
          <div style={box(true)}>delegators</div>
        </div>
        <div style={{ display: "flex", fontFamily: "monospace", fontSize: "22px", color: "#6b6259" }}>
          draft · not active on any network
        </div>
      </div>
    ),
    { ...size }
  );
}
