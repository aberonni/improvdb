/** The production origin, for absolute URLs in metadata, sitemaps and emails */
export const SITE_URL = "https://improvdb.com";

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`;
}
