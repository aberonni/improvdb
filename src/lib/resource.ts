import { type Prisma } from "@prisma/client";
import { type z } from "zod";

import { type resourceCreateSchema } from "@/utils/zod";

/**
 * Where a Resource is in its lifecycle (see GLOSSARY.md):
 * - PROPOSAL: not published yet, waiting for an admin to publish it
 * - EDIT_PROPOSAL: a suggested change to another Resource, waiting for review
 * - PUBLISHED: visible to everyone
 */
export type ResourceState = "PROPOSAL" | "EDIT_PROPOSAL" | "PUBLISHED";

export function resourceState(resource: {
  published: boolean;
  editProposalOriginalResourceId?: string | null;
}): ResourceState {
  if (resource.editProposalOriginalResourceId) return "EDIT_PROPOSAL";
  return resource.published ? "PUBLISHED" : "PROPOSAL";
}

/** What the Resource form edits and the create/save mutations accept */
export type ResourceFormValues = z.infer<typeof resourceCreateSchema>;

type Option = { label: string; value: string };

// Alternative names are stored as one string, separated by semicolons
const ALTERNATIVE_NAMES_SEPARATOR = ";";

export function splitAlternativeNames(value: string | null | undefined) {
  return (value ?? "")
    .split(ALTERNATIVE_NAMES_SEPARATOR)
    .filter((name) => name !== "");
}

function joinAlternativeNames(options: Option[]) {
  return options.map(({ value }) => value).join(ALTERNATIVE_NAMES_SEPARATOR);
}

/** Prisma data to create a Resource from form values; add createdById */
export function resourceCreateData(values: ResourceFormValues) {
  return {
    ...values,
    categories: {
      createMany: {
        data: values.categories.map(({ value }) => ({ categoryId: value })),
      },
    },
    relatedResources: {
      connect: values.relatedResources.map(({ value }) => ({ id: value })),
    },
    alternativeNames: joinAlternativeNames(values.alternativeNames),
  } satisfies Omit<Prisma.ResourceUncheckedCreateInput, "createdById">;
}

/**
 * Prisma data to bring a Resource in line with form values, adding and
 * removing only the Categories and related Resources that changed.
 */
export function resourceUpdateData(
  original: {
    categories: { categoryId: string }[];
    relatedResources: { id: string }[];
  },
  values: ResourceFormValues,
) {
  const categoryIds = values.categories.map(({ value }) => value);
  const relatedIds = values.relatedResources.map(({ value }) => value);

  return {
    ...values,
    categories: {
      createMany: {
        data: categoryIds
          .filter(
            (id) => !original.categories.some((c) => c.categoryId === id),
          )
          .map((categoryId) => ({ categoryId })),
      },
      deleteMany: original.categories
        .filter(({ categoryId }) => !categoryIds.includes(categoryId))
        .map(({ categoryId }) => ({ categoryId })),
    },
    relatedResources: {
      connect: relatedIds.map((id) => ({ id })),
      disconnect: original.relatedResources
        .filter(({ id }) => !relatedIds.includes(id))
        .map(({ id }) => ({ id })),
    },
    alternativeNames: joinAlternativeNames(values.alternativeNames),
  } satisfies Prisma.ResourceUncheckedUpdateInput;
}

/** Form values for editing a stored Resource (as resource.getById returns it) */
export function resourceFormValues(resource: {
  id: string;
  title: string;
  description: string;
  type: ResourceFormValues["type"];
  configuration: ResourceFormValues["configuration"];
  showIntroduction: string | null;
  video: string | null;
  alternativeNames: string | null;
  categories: { category: { id: string; name: string } }[];
  relatedResources: { id: string; title: string }[];
}): ResourceFormValues {
  const names = splitAlternativeNames(resource.alternativeNames);
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    configuration: resource.configuration,
    showIntroduction: resource.showIntroduction ?? undefined,
    video: resource.video ?? undefined,
    categories: resource.categories.map(({ category }) => ({
      label: category.name,
      value: category.id,
    })),
    relatedResources: resource.relatedResources.map(({ id, title }) => ({
      label: title,
      value: id,
    })),
    alternativeNames: names.map((name) => ({ label: name, value: name })),
  };
}
