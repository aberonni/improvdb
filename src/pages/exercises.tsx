import { TypeLandingPage } from "@/components/type-landing-page";
import { ResourceType } from "@/lib/enums";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

export default function Exercises() {
  return <TypeLandingPage type={ResourceType.EXERCISE} />;
}

export const getStaticProps = catalogueStaticProps(ResourceType.EXERCISE);
