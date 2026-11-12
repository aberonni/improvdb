import { ResourceType } from "@prisma/client";

import { TypeLandingPage } from "@/components/type-landing-page";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

export default function LongFormFormats() {
  return <TypeLandingPage type={ResourceType.LONG_FORM} />;
}

export const getStaticProps = catalogueStaticProps(ResourceType.LONG_FORM);
