import { expect, test } from "@playwright/test";

import { mailpitUrl, signInWithEmail } from "@/../tests/auth";

// Created by a seeded user other than user@e2e.com
const DEMO_LESSON_PLAN_ID = "clrnyapk90001wqebn7it9zqo";

test("a signed-in user cannot delete someone else's lesson plan", async ({
  page,
}) => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");
  await signInWithEmail(page, "user@e2e.com");

  const response = await page.request.post("/api/trpc/lessonPlan.delete", {
    data: { json: { id: DEMO_LESSON_PLAN_ID } },
  });
  expect(response.status()).toBe(403);

  await page.goto(`/lesson-plan/${DEMO_LESSON_PLAN_ID}`);
  await expect(
    page.getByRole("heading", { name: "Demo Lesson Plan" }),
  ).toBeVisible();
});
