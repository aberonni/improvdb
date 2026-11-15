import type { ResourceType } from "@prisma/client";
import type { GetStaticProps } from "next";

import { prefetchSiteFooter } from "@/server/helpers/siteFooterProps";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";

/**
 * `revalidate` for pages that list Resources: the Catalogue and the type and
 * Category Landing Pages. Writes rebuild these pages at once (see
 * `pagesShowing`), so this is only a safety net. Each rebuild of the
 * Catalogue writes over a megabyte to the ISR cache, which Vercel bills.
 */
export const LISTING_REVALIDATE_SECONDS = 24 * 60 * 60;

/**
 * Static props for the home page Catalogue, or a type Landing Page when given
 * its type: the Resources it lists and the Categories for its filter. Kept
 * apart from the page components so Next.js can strip it (and the server code
 * it imports) from the client bundle.
 */
export const catalogueStaticProps =
  (type?: ResourceType): GetStaticProps =>
  async () => {
    const ssg = generateSSGHelper();

    await Promise.all([
      ssg.resource.getCatalogue.prefetch(type ? { type } : undefined),
      prefetchSiteFooter(ssg),
    ]);

    return {
      props: {
        trpcState: ssg.dehydrate(),
      },
      revalidate: LISTING_REVALIDATE_SECONDS,
    };
  };
