import type { GetStaticProps } from "next";

import { generateSSGHelper } from "@/server/helpers/ssgHelper";

type SSGHelper = ReturnType<typeof generateSSGHelper>;

/**
 * Prefetches what `SiteFooter` needs, so its "Browse by category" links to the
 * category Landing Pages are in the server-rendered HTML for crawlers. Call it
 * from the `getStaticProps` of every public page that renders `PageLayout`.
 */
export const prefetchSiteFooter = (ssg: SSGHelper) =>
  ssg.category.getAll.prefetch();

/** Static props for a public page whose only data is the site footer's */
export const siteFooterStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper();

  await prefetchSiteFooter(ssg);

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 3600,
  };
};
