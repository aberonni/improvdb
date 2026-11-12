import type { ResourceType } from "@prisma/client";
import type { GetStaticProps } from "next";

import { generateSSGHelper } from "@/server/helpers/ssgHelper";

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
      ssg.category.getAll.prefetch(),
    ]);

    return {
      props: {
        trpcState: ssg.dehydrate(),
      },
      revalidate: 60,
    };
  };
