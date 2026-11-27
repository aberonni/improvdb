// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- the one place that wraps it
import NextLink from "next/link";
import { type ComponentProps, forwardRef } from "react";

/**
 * `next/link` without viewport prefetching. In production the Pages Router
 * prefetches the JS and `/_next/data` JSON of every link that scrolls into
 * view, so a Catalogue page of Resource cards fired dozens of requests per
 * visit, each one counted against Vercel's CDN request quota. With
 * `prefetch={false}` a link still prefetches when hovered, just before the
 * click. Pass `prefetch` to opt a link back in.
 */
export const Link = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof NextLink>
>(function Link({ prefetch = false, ...props }, ref) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});

export default Link;
