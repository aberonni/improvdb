import { ResourceType } from "@prisma/client";

import { LandingPage } from "@/components/landing-page";
import { typeLandingPage } from "@/lib/landing-page";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

const page = typeLandingPage(ResourceType.LONG_FORM);

export default function LongFormFormats() {
  return <LandingPage page={page} />;
}

export const getStaticProps = catalogueStaticProps(page.filter);
