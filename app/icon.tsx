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
          background: "#050505",
          borderRadius: 96,
          color: "#D4AF37",
          border: "14px solid #D4AF37",
          fontSize: 120,
          fontWeight: 800,
        }}
      >
        CVX
      </div>
    ),
    size
  );
}
