import { type Prisma } from "@prisma/client";
import type * as z from "zod";

import { type resourceCreateSchema } from "@/utils/zod";

/** What the Resource form submits */
export type ResourceInput = z.infer<typeof resourceCreateSchema>;

/** The links a Resource already has, so an update can add and remove them */
export type ExistingLinks = {
  categories: { categoryId: string }[];
  relatedResources: { id: string }[];
};

// Alternative names are stored in one column, separated by ";"
const SEPARATOR = ";";

export function encodeAlternativeNames(names: { value: string }[]): string {
  return names.map(({ value }) => value).join(SEPARATOR);
}

export function decodeAlternativeNames(stored: string | null): string[] {
  return (stored ?? "").split(SEPARATOR).filter((name) => name !== "");
}

function fields({
  id: _id,
  categories: _categories,
  relatedResources: _relatedResources,
  alternativeNames,
  ...rest
}: ResourceInput) {
  return {
    ...rest,
    alternativeNames: encodeAlternativeNames(alternativeNames),
  };
}

/** The data for a new Resource row, without its id and owners */
export function createData(input: ResourceInput) {
  return {
    ...fields(input),
    categories: {
      createMany: {
        data: input.categories.map(({ value }) => ({ categoryId: value })),
      },
    },
    relatedResources: {
      connect: input.relatedResources.map(({ value }) => ({ id: value })),
    },
  } satisfies Partial<Prisma.ResourceCreateInput>;
}

/** The data that turns an existing Resource into `input` */
export function updateData(existing: ExistingLinks, input: ResourceInput) {
  const categoryIds = new Set(input.categories.map(({ value }) => value));
  const existingCategoryIds = new Set(
    existing.categories.map(({ categoryId }) => categoryId),
  );
  const relatedIds = new Set(input.relatedResources.map(({ value }) => value));

  return {
    ...fields(input),
    categories: {
      createMany: {
        data: [...categoryIds]
          .filter((categoryId) => !existingCategoryIds.has(categoryId))
          .map((categoryId) => ({ categoryId })),
      },
      deleteMany: existing.categories
        .filter(({ categoryId }) => !categoryIds.has(categoryId))
        .map(({ categoryId }) => ({ categoryId })),
    },
    relatedResources: {
      connect: [...relatedIds].map((id) => ({ id })),
      disconnect: existing.relatedResources
        .filter(({ id }) => !relatedIds.has(id))
        .map(({ id }) => ({ id })),
    },
  } satisfies Prisma.ResourceUpdateInput;
}
