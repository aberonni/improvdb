import type { NextApiRequest, NextApiResponse } from "next";

import { db } from "@/server/db";

const SITE_URL = "https://improvdb.com";

// Static pages that should always be in the sitemap
const STATIC_PAGES = [
  { path: "/", priority: 1.0, changefreq: "daily" },
  { path: "/about", priority: 0.8, changefreq: "monthly" },
  { path: "/resource/browse", priority: 0.9, changefreq: "daily" },
  { path: "/lesson-plan/browse", priority: 0.9, changefreq: "daily" },
  { path: "/privacy", priority: 0.3, changefreq: "yearly" },
  { path: "/terms", priority: 0.3, changefreq: "yearly" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  // Get all published resources
  const resources = await db.resource.findMany({
    where: { published: true },
    select: { id: true, updatedAt: true },
  });

  // Get all public lesson plans
  const lessonPlans = await db.lessonPlan.findMany({
    where: { visibility: "PUBLIC" },
    select: { id: true, updatedAt: true },
  });

  const now = new Date();

  // Build sitemap XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static pages
  for (const page of STATIC_PAGES) {
    xml += `
  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <lastmod>${formatDate(now)}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  // Add resource pages
  for (const resource of resources) {
    xml += `
  <url>
    <loc>${SITE_URL}/resource/${escapeXml(resource.id)}</loc>
    <lastmod>${formatDate(resource.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  // Add lesson plan pages
  for (const lessonPlan of lessonPlans) {
    xml += `
  <url>
    <loc>${SITE_URL}/lesson-plan/${escapeXml(lessonPlan.id)}</loc>
    <lastmod>${formatDate(lessonPlan.updatedAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  // Set headers for XML response with caching
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  res.status(200).send(xml);
}
