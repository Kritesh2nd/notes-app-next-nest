import { randomBytes } from "crypto";

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export const AUTH_COOKIE = "bp_session";
