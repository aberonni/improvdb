import { ResourceConfiguration, ResourceType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  type ResourceFormValues,
  resourceCreateData,
  resourceFormValues,
  resourceState,
  resourceUpdateData,
  splitAlternativeNames,
} from "@/lib/resource";

const values: ResourceFormValues = {
  id: "zip-zap-zop",
  title: "Zip Zap Zop",
  description: "Pass the energy around the circle.",
  type: ResourceType.EXERCISE,
  configuration: ResourceConfiguration.CIRCLE,
  categories: [
    { label: "Focus", value: "focus" },
    { label: "Energy", value: "energy" },
  ],
  relatedResources: [{ label: "Bippity Bop", value: "bippity-bop" }],
  alternativeNames: [
    { label: "Zip Zap Boing", value: "Zip Zap Boing" },
    { label: "Zap", value: "Zap" },
  ],
};

describe("resourceState", () => {
  it("names each state", () => {
    expect(resourceState({ published: true })).toBe("PUBLISHED");
    expect(resourceState({ published: false })).toBe("PROPOSAL");
    expect(
      resourceState({
        published: false,
        editProposalOriginalResourceId: "zip-zap-zop",
      }),
    ).toBe("EDIT_PROPOSAL");
  });
});

describe("resourceCreateData", () => {
  it("links Categories and related Resources and joins alternative names", () => {
    const data = resourceCreateData(values);
    expect(data.categories).toEqual({
      createMany: { data: [{ categoryId: "focus" }, { categoryId: "energy" }] },
    });
    expect(data.relatedResources).toEqual({
      connect: [{ id: "bippity-bop" }],
    });
    expect(data.alternativeNames).toBe("Zip Zap Boing;Zap");
  });
});

describe("resourceUpdateData", () => {
  it("adds and removes only what changed", () => {
    const data = resourceUpdateData(
      {
        categories: [{ categoryId: "focus" }, { categoryId: "listening" }],
        relatedResources: [{ id: "bippity-bop" }, { id: "whoosh" }],
      },
      values,
    );
    expect(data.categories).toEqual({
      createMany: { data: [{ categoryId: "energy" }] },
      deleteMany: [{ categoryId: "listening" }],
    });
    expect(data.relatedResources).toEqual({
      connect: [{ id: "bippity-bop" }],
      disconnect: [{ id: "whoosh" }],
    });
  });
});

describe("resourceFormValues", () => {
  it("round-trips a stored Resource back into the form", () => {
    const stored = {
      ...values,
      showIntroduction: null,
      video: null,
      alternativeNames: resourceCreateData(values).alternativeNames,
      categories: values.categories.map(({ label, value }) => ({
        category: { id: value, name: label },
      })),
      relatedResources: [{ id: "bippity-bop", title: "Bippity Bop" }],
    };
    expect(resourceFormValues(stored)).toEqual({
      ...values,
      showIntroduction: undefined,
      video: undefined,
    });
  });
});

describe("splitAlternativeNames", () => {
  it("ignores empty values", () => {
    expect(splitAlternativeNames(null)).toEqual([]);
    expect(splitAlternativeNames("")).toEqual([]);
    expect(splitAlternativeNames("A;;B")).toEqual(["A", "B"]);
  });
});
