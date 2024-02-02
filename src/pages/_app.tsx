import { type AppType } from "next/app";
import { Inter as FontSans } from "next/font/google";
import Head from "next/head";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { AxiomWebVitals } from "next-axiom";
import NextNProgress from "nextjs-progressbar";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
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
        <title>ImprovDB</title>
        <meta
          name="description"
          content="The ultimate repository for improv games & exercises."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.variable};
        }
      `}</style>
      <AxiomWebVitals />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-background antialiased">
          <NextNProgress />
          <Toaster />
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
