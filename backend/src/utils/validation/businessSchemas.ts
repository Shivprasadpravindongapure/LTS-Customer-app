import { z } from "zod";

const workingHourSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  open: z.string(),
  close: z.string(),
  closed: z.boolean().optional(),
});

export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    category: z.string().min(1),
    subCategory: z.string().optional(),
    description: z.string().max(2000).optional(),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      country: z.string().min(1),
      pincode: z.string().optional(),
    }),
    contactNumbers: z.array(z.string()).optional(),
    whatsappEnabled: z.boolean().optional(),
    workingHours: z.array(workingHourSchema).optional(),
  }),
});

export const updateBusinessSchema = z.object({
  body: createBusinessSchema.shape.body.partial(),
});

export const listBusinessQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
    category: z.string().optional(),
    city: z.string().optional(),
    q: z.string().optional(),
  }),
});
