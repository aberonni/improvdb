import { describe, expect, it } from "vitest";

import {
  createData,
  decodeAlternativeNames,
  encodeAlternativeNames,
  type ResourceInput,
  updateData,
} from "@/server/resource-lifecycle/write";

const option = (value: string) => ({ label: value, value });

const input: ResourceInput = {
  id: "zip-zap-zop",
  title: "Zip Zap Zop",
  description: "Pass the energy around the circle.",
  type: "EXERCISE",
  configuration: "CIRCLE",
  categories: [option("focus"), option("energy")],
  relatedResources: [option("bunny-bunny")],
  alternativeNames: [option("Zip Zap Boing"), option("Zap")],
  video: "",
};

describe("alternative names", () => {
  it("round-trips through the stored column", () => {
    const stored = encodeAlternativeNames(input.alternativeNames);
    expect(stored).toBe("Zip Zap Boing;Zap");
    expect(decodeAlternativeNames(stored)).toEqual(["Zip Zap Boing", "Zap"]);
  });

  it("stores no names as an empty column and reads it back as none", () => {
    expect(encodeAlternativeNames([])).toBe("");
    expect(decodeAlternativeNames("")).toEqual([]);
    expect(decodeAlternativeNames(null)).toEqual([]);
  });
});

describe("createData", () => {
  it("links the Resource to its categories and related Resources", () => {
    const data = createData(input);

    expect(data).toMatchObject({
      title: "Zip Zap Zop",
      alternativeNames: "Zip Zap Boing;Zap",
      categories: {
        createMany: {
          data: [{ categoryId: "focus" }, { categoryId: "energy" }],
        },
      },
      relatedResources: { connect: [{ id: "bunny-bunny" }] },
    });
  });

  it("leaves the id to the caller", () => {
    expect(createData(input)).not.toHaveProperty("id");
  });
});

describe("updateData", () => {
  it("adds and removes only the links that changed", () => {
    const data = updateData(
      {
        categories: [{ categoryId: "focus" }, { categoryId: "listening" }],
        relatedResources: [{ id: "bunny-bunny" }, { id: "big-booty" }],
      },
      input,
    );

    expect(data.categories).toEqual({
      createMany: { data: [{ categoryId: "energy" }] },
      deleteMany: [{ categoryId: "listening" }],
    });
    expect(data.relatedResources).toEqual({
      connect: [{ id: "bunny-bunny" }],
      disconnect: [{ id: "big-booty" }],
    });
    expect(data.alternativeNames).toBe("Zip Zap Boing;Zap");
  });
});
