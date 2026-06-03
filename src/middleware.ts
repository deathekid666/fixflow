import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");
  const isAdminRoute = path.startsWith("/admin");
  const isSuspended = path.startsWith("/suspended");

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

    // Super admin bypass — never block super admins
    if (!payload.isSuperAdmin) {
      // Check if shop is suspended
      if (payload.shopStatus === "SUSPENDED") {
        if (!isSuspended) return NextResponse.redirect(new URL("/suspended?reason=suspended", req.url));
        return NextResponse.next();
      }

      // Check if trial expired
      if (payload.shopStatus === "TRIAL" && payload.trialEndsAt) {
        const trialEnd = new Date(payload.trialEndsAt).getTime();
        if (Date.now() > trialEnd) {
          if (!isSuspended) return NextResponse.redirect(new URL("/suspended?reason=trial", req.url));
          return NextResponse.next();
        }
      }
    }

    // Super admin panel — only isSuperAdmin
    if (isAdminRoute && !payload.isSuperAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/suspended"],
};