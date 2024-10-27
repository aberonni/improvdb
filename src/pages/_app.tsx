import { SpeedInsights } from "@vercel/speed-insights/next";
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
        <title>
          ImprovDB - Find improv games, exercises, and formats on ImprovDB -
          Improv games and lesson plans for teachers and students
        </title>
        <meta
          name="description"
          content="ImprovDB is the open-source database for improv games and lesson plans. Whether you're a teacher or a student, you'll find everything you need here: from warm-up exercises to short form games to long form formats, we've got you covered."
          key="desc"
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
          <SpeedInsights />
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
