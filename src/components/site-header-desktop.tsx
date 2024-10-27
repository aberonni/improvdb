import Link from "next/link";
import { useRouter } from "next/router";
import { type User } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";

import { Logo } from "@/components/logo";
import { type SiteHeaderLinks } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const UserWidget = ({ user }: { user: User }) => (
  <div className="flex items-center">
    <Avatar>
      <AvatarImage src={user.image ?? undefined} />
      <AvatarFallback>
        {user.name && user.name !== "" ? user.name[0] : "U"}
      </AvatarFallback>
    </Avatar>
    <div className="ml-2 grow">
      <h5 className="mb-1 font-medium leading-none tracking-tight">
        {user.name}
      </h5>
      <p className="text-sm leading-none">{user.email}</p>
    </div>
  </div>
);

export const SiteHeaderDesktop = ({
  navigation,
  userNavigation,
}: {
  navigation: SiteHeaderLinks;
  userNavigation: SiteHeaderLinks;
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <>
      <div className="hidden items-center md:flex">
        <div className="mr-6 flex-shrink-0">
          <Logo />
        </div>
        <div>
          <div className="flex items-center gap-6 text-sm">
            {navigation.map((item) => (
              <Link
                href={item.href}
                key={item.name}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  router.pathname.startsWith(item.href)
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
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
              <DropdownMenuTrigger className="rounded-full hover:ring-2 hover:ring-accent-foreground hover:ring-offset-2 hover:ring-offset-accent">
                <Avatar>
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback>
                    {(session.user.name ?? "U")[0]}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2 text-sm text-foreground">
                  <UserWidget user={session.user} />
                </div>
                <DropdownMenuSeparator />
                {userNavigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link href={item.href} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    signOut({
                      callbackUrl: "/",
                    })
                  }
                  className="cursor-pointer"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {status === "unauthenticated" && (
            <Button
              variant="link"
              onClick={() => signIn()}
              className="text-foreground/60 hover:text-foreground/80 hover:no-underline"
            >
              Sign In
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};
