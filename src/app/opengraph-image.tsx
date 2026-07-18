import { ImageResponse } from "next/og";

export const alt = "Quant Practice — quant interview prep drills";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f17",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 980,
            borderRadius: 16,
            border: "1px solid #243045",
            background: "#111826",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "18px 24px",
              borderBottom: "1px solid #243045",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5c5c", display: "flex" }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#f0b429", display: "flex" }} />
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#2ecc71", display: "flex" }} />
            <div style={{ marginLeft: 12, color: "#5c6b80", fontSize: 20 }}>quant_practice.sh</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", padding: "56px 64px 64px" }}>
            <div style={{ display: "flex", color: "#4a9eff", fontSize: 26, marginBottom: 18 }}>
              {"> "}QUANT_PRACTICE.SH
            </div>
            <div style={{ display: "flex", color: "#e8edf3", fontSize: 84, fontWeight: 600, lineHeight: 1.05 }}>
              Quant Practice
            </div>
            <div style={{ display: "flex", color: "#8fa1b8", fontSize: 28, marginTop: 28, lineHeight: 1.4 }}>
              Mental math · market-making · probability drills for quant interviews
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
