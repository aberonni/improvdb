import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";

import { appRouter } from "@/server/api/root";
import { db } from "@/server/db";
import { noRevalidator } from "@/server/revalidator";

export const generateSSGHelper = () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: { db, session: null, revalidator: noRevalidator },
    transformer: superjson, // optional - adds superjson serialization
  });
