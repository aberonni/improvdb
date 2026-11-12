import { describe, expect, it } from "vitest";

import {
  editProposalAcceptedEmail,
  editProposalCreatedEmail,
  proposalCreatedEmail,
  proposalPublishedEmail,
} from "@/server/notifications";

describe("lifecycle emails", () => {
  it("links to the Resource on the live site", () => {
    expect(proposalPublishedEmail("zip-zap-zop", "Zip Zap Zop").html).toContain(
      'href="https://improvdb.com/resource/zip-zap-zop"',
    );
    expect(editProposalAcceptedEmail("zip-zap-zop", "Zip").subject).toBe(
      'Your proposed edit to "Zip" has been accepted',
    );
  });

  it("names who proposed it", () => {
    const { html } = proposalCreatedEmail("zip", {
      name: "Ada",
      email: "ada@example.com",
    });
    expect(html).toContain("proposed by Ada (ada@example.com)");
    expect(editProposalCreatedEmail("zip_proposal_1", {}).html).toContain(
      "created by Someone",
    );
  });

  it("escapes what users typed", () => {
    const { html } = proposalCreatedEmail("zip", {
      name: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
