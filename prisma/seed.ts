import { ResourceConfiguration, ResourceType } from "@prisma/client";
import fs from "fs";
import lodash from "lodash";
// necessary because of https://stackoverflow.com/a/54302557
// eslint-disable-next-line @typescript-eslint/unbound-method
const { startCase } = lodash;

import { db } from "@/server/db";

import type { RouterOutputs } from "@/utils/api";
type JSONResource = RouterOutputs["resource"]["getById"] & {
  categories: string[];
};

async function main() {
  console.log("Start seeding...");

  const seedData = Object.entries(
    JSON.parse(fs.readFileSync("./prisma/seed.json", "utf8")) as Record<
      string,
      JSONResource
    >,
  );

  for (let i = 0; i < seedData.length; i++) {
    console.log("Seeding resource: ", i);

    const seed = seedData[i];
    if (!seed) {
      console.error("Seed data is empty for index: ", i);
      continue;
    }

    const seedUser = await db.user.findUniqueOrThrow({
      where: { email: "domenicogemoli@gmail.com" },
    });

    const [id, resource] = seed;

    let categories = {};

    if (resource.categories) {
      categories = {
        create: resource.categories.map((category: string) => {
          return {
            category: {
              connectOrCreate: {
                where: { id: category },
                create: { id: category, name: startCase(category) },
              },
            },
          };
        }),
      };
    }

    const createResource = {
      ...resource,
      categories,
      relatedResources: {
        create: [],
      },
      type: ResourceType.EXERCISE,
      configuration: ResourceConfiguration.SCENE,
      createdById: seedUser.id,
    };

    await db.resource.upsert({
      where: { id },
      update: createResource,
      create: createResource,
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
