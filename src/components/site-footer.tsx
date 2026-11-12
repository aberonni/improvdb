import Link from "next/link";

import { categoryLandingPage, typeLandingPages } from "@/lib/landing-page";
import { api } from "@/utils/api";

const linkClassName = "text-muted-foreground hover:text-foreground";

/** "Browse by" links to every indexable Landing Page */
export function SiteFooter() {
  const { data: categories } = api.category.getAll.useQuery();
  const categoryPages = (categories ?? [])
    .map(categoryLandingPage)
    .filter((page) => page.indexable);

  return (
    <footer className="mt-12 border-t print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 text-sm sm:grid-cols-[1fr_3fr] sm:px-6 lg:px-8">
        <nav aria-label="Browse by type">
          <h2 className="mb-3 font-semibold">Browse by type</h2>
          <ul className="space-y-2">
            {typeLandingPages.map(({ path, name }) => (
              <li key={path}>
                <Link href={path} className={linkClassName}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {categoryPages.length > 0 && (
          <nav aria-label="Browse by category">
            <h2 className="mb-3 font-semibold">Browse by category</h2>
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {categoryPages.map(({ path, name }) => (
                <li key={path}>
                  <Link href={path} className={linkClassName}>
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </footer>
  );
}
