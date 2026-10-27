import { monotonicFactory } from "ulid";

const ulid = monotonicFactory();

export type IdPrefix =
  | "usr"
  | "ses"
  | "ent"
  | "ex"
  | "prg"
  | "pwk"
  | "pss"
  | "pex"
  | "wkt"
  | "wex"
  | "wst"
  | "pr"
  | "idm"
  | "bmt"
  | "note"
  | "pvr"
  | "aig"
  | "thr"
  | "msg"
  | "rec"
  | "ntf"
  | "exp"
  | "aud"
  | "job";

export function newId(prefix: IdPrefix) {
  return `${prefix}_${ulid()}`;
}
