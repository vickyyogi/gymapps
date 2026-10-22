import { hash, verify } from "@node-rs/argon2";
import { ARGON2_OPTIONS } from "@gymapps/shared";

export function hashPassword(password: string) {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password).catch(() => false);
}
