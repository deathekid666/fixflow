import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin");

  if (!token) {
    if (isDashboard || isAdminRoute) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
    const payload = JSON.parse(atob(padded));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (isAdminRoute && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};