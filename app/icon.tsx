import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 10%, #2f8fff 0%, #18243f 50%, #090d17 100%)",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 80,
            border: "3px solid rgba(168, 208, 255, 0.45)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
            background: "linear-gradient(165deg, #1f3158, #0e1730)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f4f8ff",
            fontWeight: 900,
            fontSize: 118,
            fontStyle: "italic",
            letterSpacing: -4,
          }}
        >
          <span style={{ color: "#f5fbff" }}>FA</span>
          <span style={{ color: "#4fb0ff", marginLeft: 8 }}>P</span>
        </div>
      </div>
    ),
    size,
  );
}
