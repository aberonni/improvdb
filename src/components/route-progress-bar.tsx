import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/** Where the bar starts, as a fraction of the page width */
const START = 0.3;
/** How long to wait after a navigation ends before completing the bar */
const STOP_DELAY_MS = 200;

/**
 * A thin bar at the top of the page while a client-side navigation loads.
 * Replaces `nextjs-progressbar`, which brought `nprogress` and `prop-types`
 * into every page for the same few lines.
 */
export function RouteProgressBar() {
  const router = useRouter();
  // null while hidden, otherwise how far along the bar is (0–1)
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    let trickle: ReturnType<typeof setInterval> | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    // Shallow changes (the Catalogue's filters and sorting) only update the
    // URL and load nothing, so there's nothing to wait for
    const start = (_url: string, { shallow }: { shallow: boolean }) => {
      if (shallow) return;
      clearInterval(trickle);
      clearTimeout(timeout);
      setProgress(START);
      // Creep towards the end, slowing down, until the page arrives
      trickle = setInterval(() => {
        setProgress((p) => (p === null || p >= 1 ? p : p + (0.95 - p) * 0.1));
      }, 300);
    };

    const finish = () => {
      clearInterval(trickle);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Unless it never started (a shallow change)
        setProgress((p) => (p === null ? null : 1));
        timeout = setTimeout(() => setProgress(null), 300);
      }, STOP_DELAY_MS);
    };

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", finish);
    router.events.on("routeChangeError", finish);
    return () => {
      clearInterval(trickle);
      clearTimeout(timeout);
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", finish);
      router.events.off("routeChangeError", finish);
    };
  }, [router.events]);

  if (progress === null) {
    return null;
  }

  return (
    <div
      aria-hidden
      // Scaled rather than resized so the animation skips layout. With
      // reduced motion the bar jumps between steps and only the fade remains.
      className={`pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] w-full origin-left bg-[#29D] shadow-[0_0_10px_#29D,0_0_5px_#29D] transition-[scale,opacity] duration-200 ease-out motion-reduce:transition-opacity print:hidden ${
        progress === 1 ? "opacity-0" : "opacity-100"
      }`}
      // The only dynamic value; Tailwind can't express it
      style={{ scale: `${progress} 1` }}
    />
  );
}
