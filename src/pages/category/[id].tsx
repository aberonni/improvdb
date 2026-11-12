import type { GetStaticPaths } from "next";

import { LandingPage } from "@/components/landing-page";
import { categoryLandingPage } from "@/lib/landing-page";
import { categoryLandingPageStaticProps } from "@/server/helpers/landingPageProps";
import { api } from "@/utils/api";

export default function CategoryPage({ id }: { id: string }) {
  const { data: category } = api.category.getById.useQuery({ id });

  if (!category) return null;

  return <LandingPage page={categoryLandingPage(category)} />;
}

export const getStaticProps = categoryLandingPageStaticProps;

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};
