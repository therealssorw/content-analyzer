import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const score = searchParams.get("score");
  const title = searchParams.get("title") || "ContentLens";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a1a",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 800, color: "#ffffff", display: "flex" }}>
            Content
            <span style={{ color: "#6366f1" }}>Lens</span>
          </div>
          {score ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  fontSize: 120,
                  fontWeight: 800,
                  color: parseInt(score) >= 75 ? "#00b894" : parseInt(score) >= 50 ? "#fdcb6e" : "#e17055",
                }}
              >
                {score}
              </div>
              <div style={{ fontSize: 24, color: "#a0a0b8" }}>/100 Content Score</div>
            </div>
          ) : (
            <div style={{ fontSize: 28, color: "#a0a0b8", maxWidth: 600, textAlign: "center", display: "flex" }}>
              {title === "ContentLens" ? "AI-powered content analysis for creators who want to grow" : title}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "20px",
              padding: "8px 20px",
              borderRadius: "99px",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#6366f1", display: "flex" }} />
            <span style={{ fontSize: 16, color: "#818cf8", display: "flex" }}>AI-Powered Analysis</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
