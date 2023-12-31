import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { usePreserveScroll } from "~/hooks/usePreserveScroll";

const MyApp: AppType = ({ Component, pageProps }) => {
  usePreserveScroll();
  return <Component {...pageProps} />;
};

export default api.withTRPC(MyApp);
