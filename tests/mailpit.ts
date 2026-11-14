import { type APIRequestContext, expect } from "@playwright/test";

import { mailpitUrl } from "@/../tests/auth";

type Email = { Subject: string; HTML: string };

/**
 * Waits for an email to `to` whose body contains `text`, and returns it.
 * Search Mailpit by text unique to the test, as tests run in parallel.
 * https://mailpit.axllent.org/docs/usage/search-filters/
 */
export async function expectEmail(
  request: APIRequestContext,
  { to, text }: { to: string; text: string },
): Promise<Email> {
  let messageId: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/search`, {
          params: { query: `to:"${to}" "${text}"` },
        });
        const { messages } = (await response.json()) as {
          messages: { ID: string }[];
        };
        messageId = messages[0]?.ID;
        return messageId;
      },
      { message: `No email to ${to} containing "${text}"` },
    )
    .toBeTruthy();

  const response = await request.get(
    `${mailpitUrl}/api/v1/message/${messageId}`,
  );
  return (await response.json()) as Email;
}
