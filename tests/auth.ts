import { expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Email (magic link) sign-in, end to end. The app sends emails to Mailpit
 * (see docker-compose.e2e.yml), which the tests read through its API.
 * https://mailpit.axllent.org/docs/api-v1/
 */
export const mailpitUrl = process.env.MAILPIT_URL;

/**
 * Mailpit query for the sign-in emails sent to an address. Other emails to
 * the same address (such as Resource notifications) are left alone, so tests
 * running in parallel don't delete or misread each other's mail.
 */
const signInEmails = (email: string) => `to:"${email}" subject:"Sign in to"`;

export function uniqueEmail(page: Page) {
  const browser = page.context().browser()?.browserType().name() ?? "browser";
  return `e2e-${browser}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

export async function requestSignInEmail(page: Page, email: string) {
  await page.goto("/auth/signin");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Sign In with Email" }).click();
}

export async function getSignInLink(request: APIRequestContext, email: string) {
  let messageId: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/search`, {
          params: { query: signInEmails(email) },
        });
        const { messages } = (await response.json()) as {
          messages: { ID: string }[];
        };
        messageId = messages[0]?.ID;
        return messageId;
      },
      { message: `No sign-in email received for ${email}` },
    )
    .toBeTruthy();

  const response = await request.get(
    `${mailpitUrl}/api/v1/message/${messageId}`,
  );
  const { Text } = (await response.json()) as { Text: string };
  const link = /https?:\/\/\S+\/api\/auth\/callback\/email\S+/.exec(Text)?.[0];
  expect(link, "Sign-in email should contain a sign-in link").toBeTruthy();
  return link!;
}

/**
 * Sign in through the email flow (needs Mailpit, see docker-compose.e2e.yml).
 * Works for a fixed address, such as a seeded user, used by several tests.
 */
export async function signInWithEmail(page: Page, email: string) {
  // Drop earlier sign-in emails so we don't follow an already-used link
  const cleared = await page.request.delete(`${mailpitUrl}/api/v1/search`, {
    params: { query: signInEmails(email) },
  });
  expect(cleared.ok(), "Mailpit should delete old emails").toBe(true);

  await requestSignInEmail(page, email);
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await page.goto(await getSignInLink(page.request, email));
  await expect(page).not.toHaveURL(/\/auth\//);
}
