import { ResourceType } from "@prisma/client";

import { CataloguePage } from "@/components/catalogue";
import { typeLandingPage } from "@/lib/landing-page";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

const page = typeLandingPage(ResourceType.LONG_FORM);

export default function LongFormFormats() {
  return <CataloguePage view={page} />;
}

export const getStaticProps = catalogueStaticProps(page.filter);
