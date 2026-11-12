import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { SiteHeaderDesktop } from "@/components/site-header-desktop";
import { SiteHeaderMobile } from "@/components/site-header-mobile";
import { TYPE_LANDING_PAGE_LIST } from "@/lib/catalogue";

export type SiteHeaderLink = {
  name: string;
  href: string;
  /** Shown as a dropdown on desktop and a nested list on mobile */
  children?: { name: string; href: string }[];
};

export type SiteHeaderLinks = SiteHeaderLink[];

const catalogueLinks = [
  { name: "All games & exercises", href: "/" },
  ...TYPE_LANDING_PAGE_LIST.map(({ name, path }) => ({ name, href: path })),
];

const userNavigation = [
  { name: "My Favourites", href: "/user/my-favourite-resources" },
  { name: "My Lesson Plans", href: "/user/my-lesson-plans" },
  { name: "My Proposals", href: "/user/my-proposed-resources" },
  { name: "My Profile", href: "/user/my-profile" },
  { name: "Propose a Game or Exercise", href: "/resource/create" },
];

export function SiteHeader() {
  const { data: session } = useSession();

  const navigation = useMemo(() => {
    const nav: SiteHeaderLinks = [
      { name: "Games & Exercises", href: "/", children: catalogueLinks },
      { name: "Lesson Plans", href: "/lesson-plan/browse" },
      { name: "Create Lesson Plan", href: "/lesson-plan/create" },
      { name: "About", href: "/about" },
    ];

    if (!session?.user) {
      return nav;
    }

    if (session?.user?.role !== UserRole.ADMIN) {
      return nav;
    }

    return nav.concat([
      { name: "Pending Publication", href: "/admin/pending-publication" },
      { name: "Categories", href: "/admin/categories" },
    ]);
  }, [session]);

  return (
    <nav className="border-b bg-background print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <SiteHeaderDesktop
            navigation={navigation}
            userNavigation={userNavigation}
          />
          <SiteHeaderMobile
            navigation={navigation}
            userNavigation={userNavigation}
          />
        </div>
      </div>
    </nav>
  );
}
