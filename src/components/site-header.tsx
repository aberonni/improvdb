import { UserRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { SiteHeaderDesktop } from "@/components/site-header-desktop";
import { SiteHeaderMobile } from "@/components/site-header-mobile";

export type SiteHeaderLinks = {
  name: string;
  href: string;
}[];

const userNavigation = [
  { name: "My Favourite Resources", href: "/user/my-favourite-resources" },
  { name: "My Lesson Plans", href: "/user/my-lesson-plans" },
  { name: "My Proposed Resources", href: "/user/my-proposed-resources" },
  { name: "My Profile", href: "/user/my-profile" },
  { name: "Propose Resource", href: "/resource/create" },
];

export function SiteHeader() {
  const { data: session } = useSession();

  const navigation = useMemo(() => {
    const nav = [
      { name: "About", href: "/about" },
      { name: "Browse Resources", href: "/resource/browse" },
      { name: "Browse Lesson Plans", href: "/lesson-plan/browse" },
      { name: "Create Lesson Plan", href: "/lesson-plan/create" },
    ];

    if (!session?.user) {
      return nav;
    }

    if (session?.user?.role !== UserRole.ADMIN) {
      return nav;
    }

    return nav.concat([
      { name: "Pending Publication", href: "/admin/pending-publication" },
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
