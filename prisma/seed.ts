import fs from "fs";
import { db } from "~/server/db";

async function main() {
  console.log("Start seeding...");

  const seedData = Object.entries(
    JSON.parse(fs.readFileSync("./prisma/seed.json", "utf8")) as Record<
      string,
      unknown
    >,
  );

  for (let i = 0; i < seedData.length; i++) {
    console.log("Seeding resource: ", i);

    const seed = seedData[i];
    if (!seed) {
      console.error("Seed data is empty for index: ", i);
      continue;
    }

    const [id, resource] = seed;

    await db.resource.upsert({
      where: { id },
      update: {},
      // @ts-expect-error resource is not actually unknown
      create: resource,
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
