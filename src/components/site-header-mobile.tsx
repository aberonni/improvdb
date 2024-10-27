"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, signOut, useSession } from "next-auth/react";
import { type ReactNode, useState } from "react";

import { Logo } from "@/components/logo";
import { type SiteHeaderLinks } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function SiteHeaderMobile({
  navigation,
  userNavigation,
}: {
  navigation: SiteHeaderLinks;
  userNavigation: SiteHeaderLinks;
}) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full items-center md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="ml-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          >
            <svg
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
            >
              <path
                d="M3 5H11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M3 12H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M3 19H21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <Logo
            onClick={() => {
              setOpen(false);
            }}
          />
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
            <div className="flex flex-col space-y-3 pl-6">
              {navigation.map(
                (item) =>
                  item.href && (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      onOpenChange={setOpen}
                    >
                      {item.name}
                    </MobileLink>
                  ),
              )}
            </div>
            <div className="flex flex-col space-y-2">
              {status !== "loading" &&
                (session?.user ? (
                  <div className="pt-6">
                    <h4 className="font-medium">
                      {session?.user.name && session.user.name !== ""
                        ? session.user.name
                        : "Member's area"}
                    </h4>
                    <div className="flex flex-col space-y-3 pl-6 pt-4">
                      {userNavigation.map((item) => (
                        <MobileLink
                          href={item.href}
                          onOpenChange={setOpen}
                          key={item.href}
                        >
                          {item.name}
                        </MobileLink>
                      ))}
                      <button
                        onClick={() => {
                          setOpen(false);
                          void signOut({
                            callbackUrl: "/",
                          });
                        }}
                        className="mt-0 inline h-auto w-full pl-0 pt-0 text-left text-base font-normal text-foreground/60"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setOpen(false);
                      void signIn();
                    }}
                    variant="link"
                    className="mt-1 w-full justify-start pl-6 text-base"
                  >
                    Sign In
                  </Button>
                ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <Logo className="ml-auto mr-auto" />
      <ThemeToggle />
    </div>
  );
}

function MobileLink({
  href,
  onOpenChange,
  children,
}: {
  href: string;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={() => {
        void router.push(href);
        onOpenChange?.(false);
      }}
      className={cn(
        "transition-colors hover:text-foreground/80",
        router.pathname.startsWith(href)
          ? "text-foreground"
          : "text-foreground/60",
      )}
    >
      {children}
    </Link>
  );
}
