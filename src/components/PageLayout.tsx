import type { PropsWithChildren } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export const PageLayout = ({ children }: PropsWithChildren) => {
  const { isSignedIn } = useUser();

  return (
    <>
      <div className="h-full">
        <header className="sticky left-0 top-0 z-10 bg-white shadow">
          <div className="mx-auto flex max-w-7xl flex-row items-center px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/" className="grow">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                The Improvitory
              </h1>
            </Link>
            {isSignedIn ? (
              <>
            {isSignedIn ? <UserButton /> : <SignInButton />}
                <UserButton />
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </header>
        <main>
          <div className="relative mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
