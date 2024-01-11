import type { PropsWithChildren } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button, buttonVariants } from "~/components/ui/button";

function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export const PageLayout = ({ children }: PropsWithChildren) => {
  const { data: session, status } = useSession();

  return (
    <>
      <div className="h-full">
        <header className="sticky left-0 top-0 z-10 bg-background shadow">
          <div className="mx-auto flex max-w-7xl flex-row items-center gap-3 px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/" className="grow">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="inline-block rounded rounded-r-none border border-slate-800 bg-slate-800 py-1 pl-1.5 pr-1 text-white dark:border-white">
                  impro
                </span>
                <span className="inline-block border border-slate-800 bg-white py-1 pl-0.5 pr-1.5 text-slate-800 dark:border-white">
                  verse
                </span>
              </h1>
            </Link>
            {status === "authenticated" && (
              <>
                <Popover>
                  <PopoverTrigger>
                    <Avatar>
                      <AvatarImage src={session.user?.image ?? undefined} />
                      <AvatarFallback>
                        {(session.user.name ?? "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Link href="/user/my-resources">My Resources</Link>
                    <br />
                    <hr />
                    <br />
                    <button
                      onClick={() =>
                        signOut({
                          callbackUrl: "/",
                        })
                      }
                    >
                      Sign Out
                    </button>
                  </PopoverContent>
                </Popover>
                <Link
                  href="/create"
                  className={buttonVariants({ variant: "default" })}
                >
                  Create Resource
                </Link>
              </>
            )}
            {status === "unauthenticated" && (
              <Button variant="link" onClick={() => signIn()}>
                Sign in
              </Button>
            )}
            <ModeToggle />
          </div>
        </header>
        <main>
          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
