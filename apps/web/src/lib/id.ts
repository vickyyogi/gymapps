import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

export function newId(prefix: "usr" | "ses" | "ent") {
  return `${prefix}_${ulid()}`;
}
