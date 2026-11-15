import * as Prisma from "@prisma/client";
import { describe, expect, it } from "vitest";

import * as enums from "@/lib/enums";

describe("enums", () => {
  it.each([
    "ResourceType",
    "ResourceConfiguration",
    "LessonPlanVisibility",
    "UserRole",
  ] as const)("%s matches the Prisma schema", (name) => {
    expect(enums[name]).toEqual(Prisma[name]);
  });
});
