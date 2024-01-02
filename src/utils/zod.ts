import { ResourceType } from "@prisma/client";
import * as z from "zod";

export const resourceCreateSchema = z.object({
  id: z
    .string()
    .min(10)
    .regex(/([a-z-])/),
  title: z.string().min(2).max(50),
  description: z.string().min(20),
  type: z.nativeEnum(ResourceType),

  categories: z.array(z.object({ value: z.string() })),
  relatedResources: z.array(z.object({ value: z.string() })),

  examples: z.string().optional(),
  origin: z.string().optional(),
  learningObjectives: z.string().optional(),
  showIntroduction: z.string().optional(),
  tips: z.string().optional(),
  variations: z.string().optional(),
  video: z
    .string()
    .regex(/([a-z0-9_-])/i, "String must be a valid YouTube video ID")
    .min(11, "String must be a valid YouTube video ID")
    .max(11, "String must be a valid YouTube video ID")
    .optional()
    .or(z.literal("")),
});
