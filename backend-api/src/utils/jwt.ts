import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { AppRole, JwtPayload } from "../types/auth.js";

export function signAccessToken(payload: { sub: string; role: AppRole; email?: string }) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
