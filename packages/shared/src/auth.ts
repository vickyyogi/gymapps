import { z } from "zod";
import { LOCALES } from "./constants";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).max(128);

export const registerSchema = z.object({
  email,
  password,
  display_name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(LOCALES).default("id"),
  accept_terms: z.literal(true).optional()
});

export const loginSchema = z.object({
  email,
  password
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
