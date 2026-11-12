import { describe, expect, it } from "vitest";

import { trpcErrorMessage } from "@/lib/trpc-error";

describe("trpcErrorMessage", () => {
  it("names the first invalid field", () => {
    expect(
      trpcErrorMessage(
        {
          message: '[{"code":"too_small", ...}]',
          data: {
            zodError: {
              errors: [],
              properties: {
                id: undefined,
                title: {
                  errors: ["Too small: expected at least 2 characters"],
                },
              },
            },
          },
        },
        "Fallback",
      ),
    ).toBe("title: Too small: expected at least 2 characters");
  });

  it("uses a form-level validation error", () => {
    expect(
      trpcErrorMessage(
        { message: "[...]", data: { zodError: { errors: ["Invalid input"] } } },
        "Fallback",
      ),
    ).toBe("Invalid input");
  });

  it("uses the server's message otherwise", () => {
    expect(
      trpcErrorMessage(
        {
          message: "Lesson Plan x is not owned by you",
          data: { zodError: null },
        },
        "Fallback",
      ),
    ).toBe("Lesson Plan x is not owned by you");
  });

  it("falls back when there is no message", () => {
    expect(trpcErrorMessage({ message: "" }, "Fallback")).toBe("Fallback");
  });
});
