import {
  type Browser,
  expect,
  type Page,
  type TestInfo,
} from "@playwright/test";

import { signInWithEmail } from "@/../tests/auth";

/** Calls a tRPC mutation as the signed-in user of `page` */
export async function mutate<T>(page: Page, path: string, input: unknown) {
  const response = await page.request.post(`/api/trpc/${path}`, {
    data: { json: input },
  });
  expect(response.ok(), `${path}: ${await response.text()}`).toBe(true);
  const body = (await response.json()) as { result: { data: { json: T } } };
  return body.result.data.json;
}

/** A page in its own browser context, signed in through the email flow */
export async function signedInPage(browser: Browser, email: string) {
  const page = await (await browser.newContext()).newPage();
  await signInWithEmail(page, email);
  return page;
}
/** Unique per test run and project, as projects run in parallel */
export function unique(testInfo: TestInfo, name: string) {
  const project = testInfo.project.name.toLowerCase().replace(/\W+/g, "-");
  // Resource ids must end with a letter, so the timestamp goes first
  return `e2e-${Date.now()}-${project}-${name}`;
}

export function resourceInput(id: string, title: string) {
  return {
    id,
    title,
    description: "An exercise created by an end-to-end test.",
    type: "EXERCISE",
    configuration: "CIRCLE",
    categories: [],
    relatedResources: [],
    alternativeNames: [],
  };
}
