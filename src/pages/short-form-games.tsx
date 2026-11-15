import { TypeLandingPage } from "@/components/type-landing-page";
import { ResourceType } from "@/lib/enums";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

export default function ShortFormGames() {
  return <TypeLandingPage type={ResourceType.SHORT_FORM} />;
}

export const getStaticProps = catalogueStaticProps(ResourceType.SHORT_FORM);
