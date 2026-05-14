import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const path = req.nextUrl.pathname;

  const isDashboard = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin");

  if (!token) {
    if (isDashboard || isAdminRoute) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
    return NextResponse.next();
  }

  let user: any = null;

  try {
    user = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );
  } catch {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // 👑 ADMIN ONLY ROUTES
  if (isAdminRoute && user.role !== "ADMIN") {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};