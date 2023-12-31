import * as z from "zod";

export const resourceCreateSchema = z.object({
  id: z
    .string()
    .min(10)
    .regex(/([a-z-])/),
  title: z.string().min(2).max(50),
  description: z.string().min(20),

  categories: z.array(z.string()),

  examples: z.string().optional(),
  extra: z.string().optional(),
  format: z.string().optional(),
  origin: z.string().optional(),
  purpose: z.string().optional(),
  showIntroduction: z.string().optional(),
  tips: z.string().optional(),
  variations: z.string().optional(),
  video: z
    .string()
    .regex(/([a-z0-9_-]{11})/i)
    .optional(),
});
