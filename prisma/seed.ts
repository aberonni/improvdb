import fs from "fs";

import { type Prisma } from "@prisma/client";

import {
  seedDataFileName,
  type getSeedData,
  sessionTokenUser,
  sessionTokenAdmin,
} from "@/../prisma/seedUtils";
import { db } from "@/server/db";

async function createUsers() {
  console.log("Creating seed users...");
  const date = new Date();

  // 1. We make sure a test user exists in our local database, `upsert` will make sure we only have this user in our database
  const user = await db.user.upsert({
    where: {
      email: "user@e2e.com",
    },
    create: {
      name: "e2e_user",
      email: "user@e2e.com",
      // 2. We need a session which is used by NextAuth and represents this `e2e@e2e.com` user login session
      sessions: {
        create: {
          // 2.1. Here we are just making sure the expiration is for a future date, to avoid NextAuth to invalidate our session during the tests
          expires: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          sessionToken: sessionTokenUser,
        },
      },
      // 3. Here we are binding our user with a "Google fake account"
      accounts: {
        create: {
          type: "oauth",
          provider: "google",
          providerAccountId: "2222222",
          access_token: "ggg_zZl1pWIvKkf3UDynZ09zLvuyZsm1yC0YoRPt",
          token_type: "Bearer",
          scope:
            "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
        },
      },
    },
    update: {},
  });

  const admin = await db.user.upsert({
    where: {
      email: "admin@e2e.com",
    },
    create: {
      name: "e2e_admin",
      email: "admin@e2e.com",
      sessions: {
        create: {
          // 2.1. Here we are just making sure the expiration is for a future date, to avoid NextAuth to invalidate our session during the tests
          expires: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          sessionToken: sessionTokenAdmin,
        },
      },
      // 3. Here we are binding our user with a "Google fake account"
      accounts: {
        create: {
          type: "oauth",
          provider: "google",
          providerAccountId: "33333333",
          access_token: "aaa_zZl1pWIvKkf3UDynZ09zLvuyZsm1yC0YoRPt",
          token_type: "Bearer",
          scope:
            "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
        },
      },
    },
    update: {},
  });

  return { user, admin };
}

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (
    // DATABASE_URL used in CI
    DATABASE_URL !== "postgres://postgres:secret@postgres:5432/postgres" &&
    // DATABASE_URL used when running locally
    !DATABASE_URL?.includes("127.0.0.1")
  ) {
    throw new Error(
      "DATABASE_URL is not pointing to a local database. Aborting.",
    );
  }

  console.log("Start seeding...");

  const { admin } = await createUsers();

  const { resources, lessonPlans } = JSON.parse(
    fs.readFileSync(seedDataFileName, "utf8"),
  ) as Prisma.PromiseReturnType<typeof getSeedData>;

  const relatedResourcesToProcess: { parentId: string; relatedId: string }[] =
    [];

  for (let i = 0; i < resources.length; i++) {
    console.log("Seeding resource: ", i);

    const resource = resources[i]!;

    let categories = {};

    if (resource.categories.length > 0) {
      categories = {
        create: resource.categories.map(({ category }) => {
          return {
            category: {
              connectOrCreate: {
                where: { id: category.id },
                create: category,
              },
            },
          };
        }),
      };
    }

    resource.relatedResources.forEach((relatedResource) => {
      relatedResourcesToProcess.push({
        parentId: resource.id,
        relatedId: relatedResource.id,
      });
    });

    const createResource = {
      ...resource,
      categories,
      relatedResources: {
        create: [],
      },
      createdById: admin.id,
    };

    await db.resource.upsert({
      where: { id: resource.id },
      update: createResource,
      create: createResource,
    });
  }

  // We need to update the relatedResources after all resources have been created
  // because we need the resource ids to exist before we can connect them
  for (let i = 0; i < relatedResourcesToProcess.length; i++) {
    console.log("Seeding relatedResources: ", i);

    const { parentId, relatedId } = relatedResourcesToProcess[i]!;

    try {
      await db.resource.update({
        where: { id: parentId },
        data: {
          relatedResources: {
            connect: {
              id: relatedId,
            },
          },
        },
      });
    } catch (e) {
      console.log(
        "Skipping related resource connection because the resource does not exist:",
        relatedId,
      );
    }
  }

  for (let i = 0; i < lessonPlans.length; i++) {
    console.log("Seeding lessonPlan: ", i);

    const lessonPlan = lessonPlans[i]!;

    const sections = {
      create: lessonPlan.sections.map(({ lessonPlanId: _, ...section }) => {
        return {
          ...section,
          items: {
            create: section.items.map(
              ({ sectionId: __, resourceId: ___, ...item }) => {
                return {
                  ...item,
                  resource: item.resource?.id
                    ? {
                        connect: {
                          id: item.resource.id,
                        },
                      }
                    : undefined,
                };
              },
            ),
          },
        };
      }),
    };

    await db.lessonPlan.upsert({
      where: { id: lessonPlan.id },
      update: {
        sections,
      },
      create: {
        ...lessonPlan,
        sections,
        createdById: admin.id,
      },
    });
  }

  console.log("Seeding complete.");
}
main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
