import { z } from "zod";
import { LOCALES } from "./constants";
import type { paths } from "./openapi";

type RegisterRequest =
  paths["/auth/register"]["post"]["requestBody"]["content"]["application/json"];
type LoginRequest = paths["/auth/login"]["post"]["requestBody"]["content"]["application/json"];

const email = z.string().trim().toLowerCase().email().max(254);
const newPassword = z.string().min(8).max(128);

// Contract source is docs/api/openapi.yaml. `satisfies` fails typecheck when a
// generated request type drifts from the runtime schema.
export const registerSchema = z.object({
  email,
  password: newPassword,
  display_name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(LOCALES).default("id"),
  accept_terms: z.literal(true).optional()
}) satisfies z.ZodType<RegisterRequest, z.ZodTypeDef, unknown>;

export const loginSchema = z.object({
  email,
  // No min length: a short wrong password must return generic 401, not 422.
  password: z.string().min(1).max(128)
}) satisfies z.ZodType<LoginRequest, z.ZodTypeDef, unknown>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
