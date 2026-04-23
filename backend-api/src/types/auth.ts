export type AppRole = "WORKER" | "FACTORY" | "ADMIN";

export interface JwtPayload {
  sub: string;
  role: AppRole;
  email?: string;
}
