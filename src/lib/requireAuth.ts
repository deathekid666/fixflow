import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  shopId: string | null;
  isSuperAdmin: boolean;
  shopStatus: string;
  trialEndsAt: string | null;
};

export function requireAuth(req: Request): AuthUser | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;

  const token = cookie
    .split(";")
    .map(c => c.trim())
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] }) as AuthUser;
    if (typeof payload.id !== "string" || typeof payload.role !== "string") return null;
    if (!payload.isSuperAdmin && (payload.shopStatus === "SUSPENDED" || (payload.shopStatus === "TRIAL" && payload.trialEndsAt && new Date(payload.trialEndsAt).getTime() < Date.now()))) return null;
    return payload;
  } catch {
    return null;
  }
}