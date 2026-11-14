import { describe, expect, it } from "vitest";

import { ResourceState, stateOf } from "@/lib/resource-state";

describe("stateOf", () => {
  it("is Draft when unpublished", () => {
    expect(
      stateOf({ published: false, editProposalOriginalResourceId: null }),
    ).toBe(ResourceState.DRAFT);
  });

  it("is Published when published", () => {
    expect(
      stateOf({ published: true, editProposalOriginalResourceId: null }),
    ).toBe(ResourceState.PUBLISHED);
  });

  it("is Edit Proposal when it points at an original, whatever else is set", () => {
    for (const published of [true, false]) {
      expect(
        stateOf({ published, editProposalOriginalResourceId: "original" }),
      ).toBe(ResourceState.EDIT_PROPOSAL);
    }
  });
});
