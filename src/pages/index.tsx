import { CataloguePage } from "@/components/catalogue";
import { catalogueStaticProps } from "@/server/helpers/landingPageProps";

export default function Home() {
  return <CataloguePage view="home" />;
}

// Pre-built, so the canonical is always "/", even for filtered views; see
// docs/adr/0001.
export const getStaticProps = catalogueStaticProps();
