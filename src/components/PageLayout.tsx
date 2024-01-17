import { useMemo, type PropsWithChildren } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

import { Disclosure, Transition } from "@headlessui/react";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

import {
  ArrowLeftIcon,
  Cross1Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";

import { Button, buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Alert } from "./ui/alert";
import { type User } from "next-auth";
import { useRouter } from "next/router";
import { ThemeToggle } from "./ThemeToggle";
import { LoadingPage } from "./Loading";
import { UserRole } from "@prisma/client";

const UserWidget = ({ user }: { user: User }) => (
  <div className="flex items-center">
    <Avatar>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback>{(user.name ?? "U")[0]}</AvatarFallback>
    </Avatar>
    <div className="ml-2 grow">
      <h5 className="mb-1 font-medium leading-none tracking-tight">
        {user.name}
      </h5>
      <p className="text-sm leading-none">{user.email}</p>
    </div>
  </div>
);

export const PageLayout = ({
  children,
  className,
  showBackButton,
  authenticatedOnly,
  title,
}: PropsWithChildren & {
  title: string;
  className?: string;
  showBackButton?: boolean;
  authenticatedOnly?: boolean | UserRole[];
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const navigation = useMemo(() => {
    let nav = [
      { name: "Home", href: "/" },
      { name: "Create Resource", href: "/resource/create" },
    ];

    if (!session?.user) {
      return nav;
    }

    nav = nav.concat([
      { name: "My Contributions", href: "/user/my-contributions" },
      // { name: "My Lesson Plans", href: "/user/my-lesson-plans" },
      // { name: "Create Lesson Plan", href: "/lesson-plan/create" },
    ]);

    if (session?.user?.role !== UserRole.ADMIN) {
      return nav;
    }

    return nav.concat([
      { name: "Pending Publication", href: "/admin/pending-publication" },
    ]);
  }, [session]);

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="border-b bg-background">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Link className="text-xl font-bold tracking-tight" href="/">
                      <span className="inline-block rounded rounded-r-none border border-zinc-900 bg-zinc-900 py-1 pl-1.5 pr-1 text-white dark:border-white  dark:bg-white dark:text-zinc-900">
                        Improv
                      </span>
                      <span className="inline-block rounded rounded-l-none border border-zinc-900 bg-white py-1 pl-0.5 pr-1 font-extrabold tracking-tight text-zinc-900 dark:border-white dark:!border-l-zinc-900 dark:bg-zinc-900 dark:text-white">
                        DB
                      </span>
                    </Link>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-baseline space-x-0">
                      {navigation.map((item) => (
                        <Link
                          href={item.href}
                          key={item.name}
                          className={buttonVariants({ variant: "ghost" })}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="flex items-center space-x-4">
                    {status === "authenticated" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="rounded-full hover:ring-2 hover:ring-accent-foreground hover:ring-offset-2 hover:ring-offset-accent ">
                          <Avatar>
                            <AvatarImage
                              src={session.user.image ?? undefined}
                            />
                            <AvatarFallback>
                              {(session.user.name ?? "U")[0]}
                            </AvatarFallback>
                          </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <div className="p-2 text-sm text-foreground">
                            <UserWidget user={session.user} />
                          </div>
                          {/* <DropdownMenuItem disabled>Profile</DropdownMenuItem> */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              signOut({
                                callbackUrl: "/",
                              })
                            }
                            className="cursor-pointer"
                          >
                            Sign out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {status === "unauthenticated" && (
                      <Button variant="link" onClick={() => signIn()}>
                        Sign in
                      </Button>
                    )}
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md bg-background p-2 text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent-foreground focus:ring-offset-2 focus:ring-offset-accent">
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <Cross1Icon
                        className="block h-6 w-6"
                        aria-hidden="true"
                      />
                    ) : (
                      <HamburgerMenuIcon
                        className="block h-6 w-6"
                        aria-hidden="true"
                      />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel
                className="border-t bg-background md:hidden "
                static
              >
                <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      className={cn(
                        buttonVariants({ variant: "link" }),
                        "w-full justify-start",
                      )}
                      key={item.name}
                      as="a"
                      href={item.href}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
                <div className="px-2 pb-3 sm:px-3">
                  {session?.user ? (
                    <>
                      <Alert>
                        <UserWidget user={session.user} />
                      </Alert>
                      <div className="mt-3">
                        <Disclosure.Button
                          className={cn(
                            buttonVariants({ variant: "link" }),
                            "w-full justify-start",
                          )}
                          onClick={() => signOut()}
                        >
                          Sign Out
                        </Disclosure.Button>
                      </div>
                    </>
                  ) : (
                    <Disclosure.Button
                      className={cn(
                        buttonVariants({ variant: "link" }),
                        "w-full justify-start",
                      )}
                      onClick={() => signIn()}
                    >
                      Sign in
                    </Disclosure.Button>
                  )}
                </div>
                <div className="px-2 pb-3 sm:pb-3">
                  <ThemeToggle
                    variant="link"
                    className="w-full justify-start px-3"
                  />
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      <header className="bg-accent-foreground shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-background lg:text-5xl">
              {title}
            </h1>
            {showBackButton && (
              <Button
                variant="link"
                onClick={() => router.back()}
                className="h-auto self-baseline py-0 text-sm text-background"
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>
        <div
          className={cn(
            "relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
            className,
          )}
        >
          {authenticatedOnly ? (
            <>
              {status === "authenticated" &&
              (authenticatedOnly === true ||
                authenticatedOnly.includes(session.user.role)) ? (
                children
              ) : status === "loading" ? (
                <LoadingPage />
              ) : (
                <div className="flex w-full flex-col items-center justify-center space-y-4 rounded border p-4">
                  {authenticatedOnly === true ? (
                    <>
                      <h1 className="text-muted-foreground">
                        You must be signed in to view this page
                      </h1>
                      <Button onClick={() => signIn()}>Sign in</Button>
                    </>
                  ) : (
                    <h1 className="text-muted-foreground">
                      Only administrators can access this page.
                    </h1>
                  )}
                </div>
              )}
            </>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};
