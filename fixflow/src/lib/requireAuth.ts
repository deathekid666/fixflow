import jwt from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  shopId: string | null;
};

export function requireAuth(req: Request): AuthUser | null {
  const cookie = req.headers.get("cookie");

  if (!cookie) return null;

  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthUser;
    return payload;
  } catch {
    return null;
  }
}