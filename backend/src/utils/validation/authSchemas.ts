import { z } from "zod";

export const requestOtpSchema = z.object({
  body: z.object({
    mobile: z
      .string()
      .regex(/^[0-9]{10,15}$/, "Mobile number must be 10-15 digits, no country code symbol"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    mobile: z.string().regex(/^[0-9]{10,15}$/),
    otp: z.string().min(4).max(8),
  }),
});

export const createAccountSchema = z.object({
  body: z.object({
    mobile: z.string().regex(/^[0-9]{10,15}$/),
    name: z.string().min(2).max(80),
    role: z.enum(["business_owner", "admin"]).optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});
