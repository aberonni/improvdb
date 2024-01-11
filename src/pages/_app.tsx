import { type Session } from "next-auth";
import { type AppType } from "next/app";
import { SessionProvider } from "next-auth/react";
import NextNProgress from "nextjs-progressbar";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { usePreserveScroll } from "~/hooks/usePreserveScroll";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "~/components/theme-provider";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  usePreserveScroll();
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Improverse</title>
        <meta
          name="description"
          content="The ultimate repository for improv games & exercises."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextNProgress />
        <Toaster />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
