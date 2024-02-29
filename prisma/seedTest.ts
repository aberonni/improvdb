import { db } from "@/server/db";

async function main() {
  await db.resource.findUniqueOrThrow({
    where: {
      id: "example-kitchen-sink-test",
    },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      relatedResources: {
        select: {
          id: true,
        },
      },
    },
  });

  console.log("Found resource!");
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
