import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#D4AF37",
          border: "10px solid #D4AF37",
          borderRadius: 38,
          fontSize: 56,
          fontWeight: 800,
        }}
      >
        CVX
      </div>
    ),
    size
  );
}
