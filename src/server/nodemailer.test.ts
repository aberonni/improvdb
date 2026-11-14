import { describe, expect, it, vi } from "vitest";

// The module creates a SendGrid transport on load, which needs the env
vi.mock("@/env", () => ({ env: { EMAIL_SERVER_PASSWORD: "test" } }));

const { escapeHtml } = await import("@/server/nodemailer");

describe("escapeHtml", () => {
  it("escapes markup in text users typed", () => {
    expect(escapeHtml('<script>alert("hi")</script> & co')).toBe(
      "&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt; &amp; co",
    );
  });

  it("treats a missing value as empty", () => {
    expect(escapeHtml(null)).toBe("");
  });
});
