import { ChevronRightIcon } from "@radix-ui/react-icons";
import Head from "next/head";
import Link from "next/link";
import { Fragment } from "react";

const SITE_URL = "https://improvdb.com";

export type BreadcrumbItem = {
  name: string;
  /** Omit for the current page */
  href?: string;
};

/** Visible breadcrumb trail plus its schema.org BreadcrumbList */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          key="breadcrumbs"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>
      <nav aria-label="Breadcrumb" className="mb-2 print:hidden">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-background/70">
          {items.map((item, index) => (
            <Fragment key={item.name}>
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              )}
              <li>
                {item.href ? (
                  <Link href={item.href} className="hover:text-background">
                    {item.name}
                  </Link>
                ) : (
                  <span aria-current="page">{item.name}</span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}
