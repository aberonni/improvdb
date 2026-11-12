import type { GetStaticProps } from "next";

import { generateSSGHelper } from "@/server/helpers/ssgHelper";

/**
 * Static props for a type Landing Page. Kept apart from the page component so
 * Next.js can strip it (and the server code it imports) from the client
 * bundle.
 */
export const getTypeLandingPageStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper();

  await Promise.all([
    ssg.resource.getAll.prefetch(),
    ssg.category.getAll.prefetch(),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60,
  };
};
