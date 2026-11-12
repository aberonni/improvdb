import { expect, test, type APIRequestContext } from "@playwright/test";

import {
  getSignInLink,
  mailpitUrl,
  requestSignInEmail,
  uniqueEmail,
} from "@/../tests/auth";

/** Make Mailpit reject every email (or stop doing so, with no argument). */
async function setMailpitFailure(request: APIRequestContext, errorCode = 0) {
  const response = await request.put(`${mailpitUrl}/api/v1/chaos`, {
    data: errorCode
      ? { Sender: { ErrorCode: errorCode, Probability: 100 } }
      : {},
  });
  expect(response.ok(), "Mailpit chaos must be enabled").toBe(true);
}

test.describe("Email sign-in", () => {
  test.skip(!mailpitUrl, "Needs Mailpit: run with `npm run test:e2e`");
  // The failure test changes Mailpit for everyone, so don't run these tests
  // at the same time as each other (CI and `npm run test:e2e` use 1 worker).
  test.describe.configure({ mode: "serial" });

  test("signs in with a magic link", async ({ page, request }) => {
    const email = uniqueEmail(page);

    await requestSignInEmail(page, email);
    await expect(page).toHaveURL(/\/auth\/verify-request/);
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    const link = await getSignInLink(request, email);
    await page.goto(link);

    // Signed-in users are redirected away from the sign-in page
    await expect(page).not.toHaveURL(/\/auth\//);
    const session = await page.request.get(
      `${new URL(link).origin}/api/auth/session`,
    );
    expect(await session.json()).toMatchObject({ user: { email } });
  });

  test("shows an error when the email can't be sent", async ({
    page,
    request,
  }) => {
    await setMailpitFailure(request, 451);
    try {
      await requestSignInEmail(page, uniqueEmail(page));

      await expect(page).toHaveURL(/\/auth\/signin\?.*error=EmailSignin/);
      await expect(
        page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
      ).toContainText("We couldn't send you a sign-in email");
    } finally {
      await setMailpitFailure(request);
    }
  });
});

test("shows an error for an invalid sign-in link", async ({ page }) => {
  await page.goto(
    "/api/auth/callback/email?token=invalid&email=nobody%40example.com",
  );

  await expect(page).toHaveURL(/\/auth\/signin\?.*error=Verification/);
  await expect(
    page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
  ).toContainText("This sign-in link is invalid or has expired");
});
