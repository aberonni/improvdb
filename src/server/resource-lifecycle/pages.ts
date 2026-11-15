import { type ResourceType } from "@prisma/client";

import { categoryLandingPath, TYPE_LANDING_PAGES } from "@/lib/catalogue";

/** What decides which statically generated pages show a Resource */
export type Listing = {
  id: string;
  published: boolean;
  type: ResourceType;
  categoryIds: string[];
};

/**
 * The statically generated pages that show a Resource, before or after a
 * change: its own page, and, while it is Published, the Catalogue, its type's
 * Landing Page and its Categories' Landing Pages.
 */
export function pagesShowing(...versions: Listing[]): string[] {
  const paths = new Set<string>();
  for (const version of versions) {
    paths.add(`/resource/${version.id}`);
    if (!version.published) continue;
    paths.add("/");
    paths.add(TYPE_LANDING_PAGES[version.type].path);
    for (const categoryId of version.categoryIds) {
      paths.add(categoryLandingPath(categoryId));
    }
  }
  return [...paths];
}
