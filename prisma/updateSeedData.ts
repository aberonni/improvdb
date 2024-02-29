import fs from "fs";

import { seedDataFileName, getSeedData } from "@/../prisma/seedUtils";
import { db } from "@/server/db";

async function main() {
  console.log("Start retrieving seed data...");

  const seedData = await getSeedData();
  fs.writeFileSync(seedDataFileName, JSON.stringify(seedData, null, 2), "utf8");

  console.log("Seed data retrieved and saved to: ", seedDataFileName);
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
