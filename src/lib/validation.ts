import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password too long");

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const createStreakSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().trim().max(500).optional().nullable(),
});

export const updateStreakSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  archivedAt: z.union([z.date(), z.null()]).optional(),
});

export const checkInSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected date as YYYY-MM-DD"),
  level: z.enum(["NONE", "PARTIAL", "FULL"]),
  note: z.string().trim().max(500).optional().nullable(),
});

export type CheckInLevel = "NONE" | "PARTIAL" | "FULL";
