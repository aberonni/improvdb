/**
 * The Prisma schema's enums, for code that runs in the browser. Importing
 * their values from `@prisma/client` bundles its browser build (Decimal.js
 * included, ~40 KB) into every page that uses them; types are free, so each
 * object is checked against Prisma's own type here.
 */
import type * as Prisma from "@prisma/client";

/** Every member of a Prisma enum, keyed by itself */
type EnumObject<T extends string> = { readonly [K in T]: K };

export const ResourceType = {
  EXERCISE: "EXERCISE",
  SHORT_FORM: "SHORT_FORM",
  LONG_FORM: "LONG_FORM",
} as const satisfies EnumObject<Prisma.ResourceType>;
export type ResourceType = Prisma.ResourceType;

export const ResourceConfiguration = {
  SOLO: "SOLO",
  PAIRS: "PAIRS",
  GROUPS: "GROUPS",
  WHOLE_CLASS: "WHOLE_CLASS",
  CIRCLE: "CIRCLE",
  BACKLINE: "BACKLINE",
  SCENE: "SCENE",
} as const satisfies EnumObject<Prisma.ResourceConfiguration>;
export type ResourceConfiguration = Prisma.ResourceConfiguration;

export const LessonPlanVisibility = {
  PRIVATE: "PRIVATE",
  UNLISTED: "UNLISTED",
  PUBLIC: "PUBLIC",
} as const satisfies EnumObject<Prisma.LessonPlanVisibility>;
export type LessonPlanVisibility = Prisma.LessonPlanVisibility;

export const UserRole = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const satisfies EnumObject<Prisma.UserRole>;
export type UserRole = Prisma.UserRole;
