import type { GetStaticPaths, GetStaticProps } from "next";
import { useCallback } from "react";

import { LandingPage } from "@/components/landing-page";
import {
  categoryLandingPath,
  EMPTY_CATALOGUE_STATE,
  MIN_RESOURCES_TO_INDEX,
} from "@/lib/catalogue";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { api } from "@/utils/api";

function paragraphs(text: string | null | undefined) {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function CategoryPage({ id }: { id: string }) {
  const { data: category } = api.category.getById.useQuery({ id });
  const matches = useCallback(
    (resource: { categories: { id: string }[] }) =>
      resource.categories.some((c) => c.id === id),
    [id],
  );

  if (!category) return null;

  const fallbackIntro = `Improv games and exercises for practising ${category.name.toLowerCase()}. Filter them by type or group setup to find one for your next class or rehearsal.`;
  const intro = paragraphs(category.description);
  const description = (intro[0] ?? fallbackIntro).slice(0, 300);

  return (
    <LandingPage
      path={categoryLandingPath(category.id)}
      name={category.name}
      title={`${category.name} Improv Games & Exercises`}
      heading={category.name}
      subtitle={(count) =>
        `${count} improv ${count === 1 ? "game or exercise" : "games and exercises"} for practising ${category.name.toLowerCase()}`
      }
      description={description}
      intro={intro.length ? intro : [fallbackIntro]}
      initialState={{ ...EMPTY_CATALOGUE_STATE, category: [category.id] }}
      matches={matches}
      noIndex={category._count.resources < MIN_RESOURCES_TO_INDEX}
    />
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const id = context.params?.id;
  if (typeof id !== "string" || id === "") return { notFound: true };

  const ssg = generateSSGHelper();
  const category = await ssg.category.getById.fetch({ id });

  if (!category) return { notFound: true, revalidate: 60 };

  await Promise.all([
    ssg.resource.getAll.prefetch(),
    ssg.category.getAll.prefetch(),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
    revalidate: 60,
  };
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};
