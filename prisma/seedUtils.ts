import { db } from "@/server/db";

export const seedDataFileName = "./prisma/seedData.json";

// This are dummy random session tokens
export const sessionTokenUser = "04456e41-ec3b-4edf-92c1-48c14e57cacd2";
export const sessionTokenAdmin = "97879e41-ec3b-4edf-92c1-48c14e57cacd2";

export async function getSeedData() {
  const resources = await db.resource.findMany({
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

  const lessonPlans = await db.lessonPlan.findMany({
    where: { visibility: "PUBLIC" },
    include: {
      sections: {
        include: {
          items: {
            include: {
              resource: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  type: true,
                  configuration: true,
                  categories: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });
  return { resources, lessonPlans };
}
