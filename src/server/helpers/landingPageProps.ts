import type { GetStaticProps } from "next";

import { type LandingPageFilter } from "@/lib/landing-page";
import { prefetchSiteFooter } from "@/server/helpers/siteFooterProps";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";

/**
 * Static props for a Catalogue page. Kept apart from the page components so
 * Next.js can strip it (and the server code it imports) from the client
 * bundle. Pages are rebuilt in the background every minute (see
 * docs/adr/0001).
 */
const REVALIDATE_SECONDS = 60;

type SSGHelper = ReturnType<typeof generateSSGHelper>;

async function prefetchCatalogue(ssg: SSGHelper, filter?: LandingPageFilter) {
  await Promise.all([
    ssg.resource.getCatalogue.prefetch(filter),
    // The Catalogue's category filter and the site footer's links
    prefetchSiteFooter(ssg),
  ]);
}

/** The home page Catalogue, or a type Landing Page when given its filter */
export const catalogueStaticProps =
  (filter?: LandingPageFilter): GetStaticProps =>
  async () => {
    const ssg = generateSSGHelper();
    await prefetchCatalogue(ssg, filter);
    return {
      props: { trpcState: ssg.dehydrate() },
      revalidate: REVALIDATE_SECONDS,
    };
  };

/** A Category Landing Page, built on first request; 404 for an unknown id */
export const categoryLandingPageStaticProps: GetStaticProps = async (
  context,
) => {
  const id = context.params?.id;
  if (typeof id !== "string" || id === "") return { notFound: true };

  const ssg = generateSSGHelper();
  const category = await ssg.category.getById.fetch({ id });
  if (!category) return { notFound: true, revalidate: REVALIDATE_SECONDS };

  await prefetchCatalogue(ssg, { category: id });

  return {
    props: { trpcState: ssg.dehydrate(), id },
    revalidate: REVALIDATE_SECONDS,
  };
};
