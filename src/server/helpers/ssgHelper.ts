import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";

import { appRouter } from "@/server/api/root";
import { db } from "@/server/db";

export const generateSSGHelper = () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: { db, session: null },
    transformer: superjson, // optional - adds superjson serialization
  });
