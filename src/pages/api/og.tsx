import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

const RESOURCE_TYPE_EMOJI: Record<string, string> = {
  EXERCISE: "🚀",
  SHORT_FORM: "⚡️",
  LONG_FORM: "🍿",
};

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  EXERCISE: "Warm-up / Exercise",
  SHORT_FORM: "Short Form Game",
  LONG_FORM: "Long Form Format",
};

// Load Inter font weights from Google Fonts
const interRegular = fetch(
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

const interMedium = fetch(
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

const interBold = fetch(
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

const interExtraBold = fetch(
  "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZ9hjp-Ek-_EeA.woff",
).then((res) => res.arrayBuffer());

// Matches src/components/logo.tsx styling
function Logo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: "32px",
        fontWeight: 700,
        letterSpacing: "-0.025em",
      }}
    >
      <div
        style={{
          display: "flex",
          borderRadius: "6px 0 0 6px",
          border: "2px solid #18181b",
          backgroundColor: "#18181b",
          padding: "4px 8px 4px 10px",
          color: "#ffffff",
        }}
      >
        Improv
      </div>
      <div
        style={{
          display: "flex",
          borderRadius: "0 6px 6px 0",
          border: "2px solid #18181b",
          borderLeft: "none",
          backgroundColor: "#ffffff",
          padding: "4px 4px 4px 4px",
          fontWeight: 800,
          color: "#18181b",
        }}
      >
        DB
      </div>
    </div>
  );
}

export default async function handler(req: NextRequest) {
  const [interRegularData, interMediumData, interBoldData, interExtraBoldData] =
    await Promise.all([interRegular, interMedium, interBold, interExtraBold]);

  const { searchParams } = new URL(req.url);

  const title = searchParams.get("title") ?? "ImprovDB";
  const type = searchParams.get("type"); // EXERCISE, SHORT_FORM, LONG_FORM, or LESSON_PLAN
  const description = searchParams.get("description");
  const author = searchParams.get("author");

  const isLessonPlan = type === "LESSON_PLAN";
  const isResource = type && !isLessonPlan;

  const emoji = isResource
    ? RESOURCE_TYPE_EMOJI[type]
    : isLessonPlan
      ? "📋"
      : "🎭";
  const typeLabel = isResource
    ? RESOURCE_TYPE_LABEL[type]
    : isLessonPlan
      ? "Lesson Plan"
      : null;

  const truncatedDescription =
    description && description.length > 150
      ? description.slice(0, 150) + "..."
      : description;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          backgroundColor: "#ffffff",
          padding: "64px",
          fontFamily: "Inter",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <Logo />
          {typeLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#f4f4f5",
                padding: "12px 24px",
                borderRadius: "9999px",
                border: "1px solid #e4e4e7",
              }}
            >
              <span style={{ fontSize: "24px", marginRight: "12px" }}>
                {emoji}
              </span>
              <span
                style={{
                  fontSize: "20px",
                  color: "#52525b",
                  fontWeight: 500,
                }}
              >
                {typeLabel}
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: title.length > 40 ? "56px" : "72px",
              fontWeight: 700,
              color: "#18181b",
              lineHeight: 1.1,
              marginBottom: truncatedDescription ? "24px" : "0",
            }}
          >
            {title}
          </div>

          {truncatedDescription && (
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                color: "#71717a",
                lineHeight: 1.4,
                maxWidth: "900px",
              }}
            >
              {truncatedDescription}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid #e4e4e7",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: "#18181b",
            }}
          >
            improvdb.com
          </span>
          {author && (
            <span
              style={{
                fontSize: "20px",
                color: "#a1a1aa",
              }}
            >
              Created by {author}
            </span>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interRegularData,
          style: "normal",
          weight: 400,
        },
        {
          name: "Inter",
          data: interMediumData,
          style: "normal",
          weight: 500,
        },
        {
          name: "Inter",
          data: interBoldData,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: interExtraBoldData,
          style: "normal",
          weight: 800,
        },
      ],
    },
  );
}
