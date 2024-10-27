import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = React.HTMLAttributes<HTMLAnchorElement>;

export function Logo({ className, ...props }: LogoProps) {
  return (
    <Link
      className={cn("text-xl font-bold tracking-tight", className)}
      href="/"
      {...props}
    >
      <span className="inline-block rounded rounded-r-none border border-zinc-900 bg-zinc-900 py-1 pl-1.5 pr-1 text-white dark:border-white dark:bg-white dark:text-zinc-900">
        Improv
      </span>
      <span className="inline-block rounded rounded-l-none border border-zinc-900 bg-white py-1 pl-0.5 pr-1 font-extrabold tracking-tight text-zinc-900 dark:border-white dark:!border-l-zinc-900 dark:bg-zinc-900 dark:text-white">
        DB
      </span>
    </Link>
  );
}
