import type { PropsWithChildren } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export const PageLayout = ({ children }: PropsWithChildren) => {
  const { data: session, status } = useSession();

  return (
    <>
      <div className="h-full">
        <header className="sticky left-0 top-0 z-10 bg-white shadow">
          <div className="mx-auto flex max-w-7xl flex-row items-center gap-3 px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/" className="grow">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="inline-block rounded rounded-r-none border border-slate-800 bg-slate-800 py-1 pl-1.5 pr-1 text-white">
                  impro
                </span>
                <span className="inline-block border border-slate-800 py-1 pl-0.5 pr-1.5 text-slate-800 ">
                  verse
                </span>
              </h1>
            </Link>
            {status === "authenticated" && (
              <>
                <Link href="/user/my-resources">My Resources</Link>
                <Link
                  href="/create"
                  className="rounded bg-green-700 px-3 py-1 text-white transition-colors hover:bg-green-600"
                >
                  Create
                </Link>
                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/",
                    })
                  }
                >
                  Sign Out
                </button>
                {/* {session.user?.image && (
                  <Image
                    src={session.user?.image}
                    alt="Profile Picture"
                    width={32}
                    height={32}
                  />
                )} */}
              </>
            )}
            {status === "unauthenticated" && (
              <button onClick={() => signIn()}>Sign in</button>
            )}
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
