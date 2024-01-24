import { ResourceType, ResourceConfiguration } from "@prisma/client";
import * as z from "zod";

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === "object" && issue.received === "null") {
      return { message: "Required" };
    }
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

export const resourceCreateSchema = z.object({
  id: z
    .string()
    .regex(/[a-z\-]+$/, "id can only contain lowercase letters and dashes"),
  title: z.string().min(2).max(50),
  description: z.string().min(20),
  type: z.nativeEnum(ResourceType),
  configuration: z.nativeEnum(ResourceConfiguration),

  categories: z.array(z.object({ label: z.string(), value: z.string() })),
  showIntroduction: z.string().optional(),
  video: z
    .string()
    .regex(/([a-z0-9_-])/i, "String must be a valid YouTube video ID")
    .min(11, "String must be a valid YouTube video ID")
    .max(11, "String must be a valid YouTube video ID")
    .optional()
    .or(z.literal("")),
  alternativeNames: z.array(
    z.object({ label: z.string(), value: z.string().regex(/([^;])/) }),
  ),

  relatedResources: z.array(z.object({ label: z.string(), value: z.string() })),
});

export const lessonPlanCreateSchema = z.object({
  title: z.string().min(2).max(50),
  theme: z.string().optional(),
  description: z.string().optional(),
  useDuration: z.boolean(),
  private: z.boolean(),
  sections: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().optional(),
      items: z.array(
        z.object({
          id: z.string().optional(),
          text: z.string().optional(),
          resource: z
            .object({ label: z.string(), value: z.string() })
            .optional(),
          duration: z.union([z.number().int(), z.nan()]).optional(),
        }),
      ),
    }),
  ),
});
