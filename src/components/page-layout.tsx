import { type UserRole } from "@prisma/client";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import { type PropsWithChildren } from "react";

import { LoadingPage } from "@/components/loading";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const PageLayout = ({
  children,
  className,
  showBackButton,
  authenticatedOnly,
  title,
  headerContent,
}: PropsWithChildren & {
  title: React.ReactNode;
  className?: string;
  showBackButton?: boolean;
  authenticatedOnly?: boolean | UserRole[];
  headerContent?: React.ReactNode;
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-full">
      <SiteHeader />
      <header className="bg-accent-foreground shadow print:bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-background lg:text-5xl print:text-foreground">
              {title}
            </h1>
            {showBackButton && (
              <Button
                variant="link"
                onClick={() => router.back()}
                className="h-auto self-baseline py-0 text-sm text-background print:hidden"
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
            {headerContent}
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
                <div className="flex w-full flex-col items-center justify-center space-y-4 rounded-md border p-4">
                  {authenticatedOnly === true ? (
                    <>
                      <h2 className="text-muted-foreground">
                        You must be signed in to view this page
                      </h2>
                      <Button onClick={() => signIn()}>Sign in</Button>
                    </>
                  ) : (
                    <h2 className="text-muted-foreground">
                      Only administrators can access this page.
                    </h2>
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

export const SplitPageLayout = ({ children }: PropsWithChildren) => {
  return (
    <article className="w-full">
      <div className="grid h-full items-stretch gap-0 md:grid-cols-[300px_1fr] lg:grid-cols-[400px_1fr]">
        {children}
      </div>
    </article>
  );
};

export const SplitPageLayoutSidebar = ({ children }: PropsWithChildren) => {
  return (
    <div className="top-0 col-span-1 flex flex-col space-y-4 self-start md:sticky md:h-screen md:pt-8">
      <ScrollArea className="pt-8 md:min-h-full md:pb-8 md:pr-16 md:pt-0">
        {children}
      </ScrollArea>
    </div>
  );
};

export const SplitPageLayoutContent = ({ children }: PropsWithChildren) => {
  return (
    <div className="mb-6 mt-8 md:mt-8 md:border-l md:border-l-muted md:pl-8">
      <Separator className="mb-8 block md:hidden" />
      {children}
    </div>
  );
};
