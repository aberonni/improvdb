import { ResourceType, ResourceConfiguation } from "@prisma/client";
import * as z from "zod";

export const resourceCreateSchema = z.object({
  id: z
    .string()
    .regex(/[a-z\-]+$/, "id can only contain lowercase letters and dashes"),
  title: z.string().min(2).max(50),
  description: z.string().min(20),
  type: z.nativeEnum(ResourceType),
  configuration: z.nativeEnum(ResourceConfiguation),
  groupSize: z.number(),

  categories: z.array(z.object({ label: z.string(), value: z.string() })),
  showIntroduction: z.string().optional(),
  video: z
    .string()
    .regex(/([a-z0-9_-])/i, "String must be a valid YouTube video ID")
    .min(11, "String must be a valid YouTube video ID")
    .max(11, "String must be a valid YouTube video ID")
    .optional()
    .or(z.literal("")),
  alternativeNames: z.array(z.object({ value: z.string().regex(/([^;])/) })),

  relatedResources: z.array(z.object({ label: z.string(), value: z.string() })),
});
