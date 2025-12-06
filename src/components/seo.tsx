import Head from "next/head";

const SITE_NAME = "ImprovDB";
const SITE_URL = "https://improvdb.com";
const DEFAULT_DESCRIPTION =
  "ImprovDB is the open-source database for improv games and lesson plans. Find warm-up exercises, short form games, and long form formats.";

function generateOgImageUrl(params: {
  title: string;
  type?: string;
  description?: string | null;
  author?: string | null;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("title", params.title);
  if (params.type) searchParams.set("type", params.type);
  if (params.description) searchParams.set("description", params.description);
  if (params.author) searchParams.set("author", params.author);
  return `${SITE_URL}/api/og?${searchParams.toString()}`;
}

const DEFAULT_OG_IMAGE = generateOgImageUrl({
  title: "Improv Games, Exercises & Lesson Plans",
  description: "ImprovDB is the open-source database for improv games and lesson plans. Find warm-up exercises, short form games, long form formats, and share lesson plans with other improv teachers."
});

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  noIndex = false,
}: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} key="desc" />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
    </Head>
  );
}

interface ResourceSEOProps {
  title: string;
  description: string | null;
  type: string;
  id: string;
  categories?: string[];
}

export function ResourceSEO({
  title,
  description,
  type,
  id,
  categories = [],
}: ResourceSEOProps) {
  const pageDescription =
    description ??
    `Learn about ${title}, an improv ${type.toLowerCase().replace("_", " ")} on ImprovDB.`;

  const ogImage = generateOgImageUrl({
    title,
    type,
    description,
  });

  // Structured data for better Google rich snippets
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: pageDescription,
    author: {
      "@type": "Organization",
      name: "ImprovDB",
    },
    publisher: {
      "@type": "Organization",
      name: "ImprovDB",
      url: SITE_URL,
    },
    keywords: ["improv", "improvisation", type.toLowerCase(), ...categories],
  };

  return (
    <>
      <SEO
        title={`${title} - Improv ${type.toLowerCase().replace("_", " ")}`}
        description={pageDescription}
        canonical={`/resource/${id}`}
        ogImage={ogImage}
        ogType="article"
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    </>
  );
}

interface LessonPlanSEOProps {
  title: string;
  description: string | null;
  id: string;
  creatorName?: string | null;
}

export function LessonPlanSEO({
  title,
  description,
  id,
  creatorName,
}: LessonPlanSEOProps) {
  const pageDescription =
    description ?? `${title} - An improv lesson plan on ImprovDB.`;

  const ogImage = generateOgImageUrl({
    title,
    type: "LESSON_PLAN",
    description,
    author: creatorName,
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: pageDescription,
    author: {
      "@type": "Person",
      name: creatorName ?? "ImprovDB User",
    },
    publisher: {
      "@type": "Organization",
      name: "ImprovDB",
      url: SITE_URL,
    },
    keywords: ["improv", "improvisation", "lesson plan", "teaching"],
  };

  return (
    <>
      <SEO
        title={`${title} - Lesson Plan`}
        description={pageDescription}
        canonical={`/lesson-plan/${id}`}
        ogImage={ogImage}
        ogType="article"
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
    </>
  );
}
