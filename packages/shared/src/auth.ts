import { z } from "zod";
import { LOCALES } from "./constants";
import type { paths } from "./openapi";

type RegisterRequest =
  paths["/auth/register"]["post"]["requestBody"]["content"]["application/json"];
type LoginRequest = paths["/auth/login"]["post"]["requestBody"]["content"]["application/json"];
type ChangePasswordRequest =
  paths["/auth/password/change"]["post"]["requestBody"]["content"]["application/json"];
type DeleteAccountRequest =
  paths["/account"]["delete"]["requestBody"]["content"]["application/json"];

const email = z.string().trim().toLowerCase().email().max(254);
const newPassword = z.string().min(8).max(128);

export function isAtLeastAge(birthDateStr: string, minAgeYears = 16, now = new Date()): boolean {
  const parsed = new Date(`${birthDateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear() - minAgeYears, now.getUTCMonth(), now.getUTCDate())
  );
  return parsed <= cutoff;
}

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .refine((val) => isAtLeastAge(val, 16), {
    message: "Minimum age is 16 years"
  });

// Contract source is docs/api/openapi.yaml. `satisfies` fails typecheck when a
// generated request type drifts from the runtime schema.
export const registerSchema = z.object({
  email,
  password: newPassword,
  display_name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(LOCALES).default("id"),
  accept_terms: z.literal(true).optional(),
  birth_date: birthDateSchema.optional()
}) satisfies z.ZodType<RegisterRequest, z.ZodTypeDef, unknown>;

export const loginSchema = z.object({
  email,
  // No min length: a short wrong password must return generic 401, not 422.
  password: z.string().min(1).max(128)
}) satisfies z.ZodType<LoginRequest, z.ZodTypeDef, unknown>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1).max(128),
    new_password: newPassword
  })
  .refine((val) => val.current_password !== val.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"]
  }) satisfies z.ZodType<ChangePasswordRequest, z.ZodTypeDef, unknown>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
  confirm: z.literal("DELETE")
}) satisfies z.ZodType<DeleteAccountRequest, z.ZodTypeDef, unknown>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
