import { type ResourceType } from "@prisma/client";
import { useCallback } from "react";

import { LandingPage } from "@/components/landing-page";
import { EMPTY_CATALOGUE_STATE, TYPE_LANDING_PAGES } from "@/lib/catalogue";

export function TypeLandingPage({ type }: { type: ResourceType }) {
  const page = TYPE_LANDING_PAGES[type];
  const matches = useCallback(
    (resource: { type: ResourceType }) => resource.type === type,
    [type],
  );

  return (
    <LandingPage
      path={page.path}
      name={page.name}
      title={page.heading}
      heading={page.heading}
      subtitle={(count) =>
        `${count} ${page.name.toLowerCase()}, free and open source`
      }
      description={page.description}
      intro={page.intro}
      initialState={{ ...EMPTY_CATALOGUE_STATE, type: [type] }}
      matches={matches}
    />
  );
}
