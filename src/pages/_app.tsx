import { type AppType, type NextWebVitalsMetric } from "next/app";
import { Inter as FontSans } from "next/font/google";
import Head from "next/head";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { LazyToaster } from "@/components/lazy-toaster";
import { RouteProgressBar } from "@/components/route-progress-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { usePreserveScroll } from "@/hooks/use-preserve-scroll";
import { api } from "@/utils/api";

import "@/styles/globals.css";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  usePreserveScroll();
  return (
    <SessionProvider session={session}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.variable};
        }
      `}</style>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-dvh bg-background antialiased">
          <RouteProgressBar />
          <LazyToaster />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
};

/**
 * Sends Core Web Vitals to Axiom, the only reporter: each report is a request
 * against Vercel's CDN quota, so Vercel Speed Insights is not loaded too.
 * Next.js calls this from `_app` on every
 * page, so it replaces next-axiom's `<AxiomWebVitals />`, whose entry point
 * bundled all of next-axiom (server helpers included) into every page. The
 * sender loads once the first metric arrives, after the page has rendered.
 */
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label !== "web-vital") return;
  const route = window.location.pathname;
  void import("next-axiom/dist/webVitals/webVitals").then((axiom) =>
    axiom.reportWebVitalsWithPath(metric, route),
  );
}

export default api.withTRPC(MyApp);
