import type { PropsWithChildren } from "react";

export const PageLayout = ({
  children,
  title,
}: PropsWithChildren<{ title: string }>) => {
  return (
    <>
      <div className="flex h-screen flex-col">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {title}
            </h1>
          </div>
        </header>
        <main className="grow overflow-auto">
          <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
