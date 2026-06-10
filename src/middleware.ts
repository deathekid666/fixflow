import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter — persists within a single server process (next start).
// In edge/serverless deployments each isolate has its own counter, so effective
// limit per replica will be lower; swap for Redis if you need cross-replica enforcement.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

// Periodically purge expired entries to prevent unbounded memory growth.
// Runs at most once every 5 minutes regardless of traffic.
let lastPurge = 0;
function maybePurge() {
  const now = Date.now();
  if (now - lastPurge < 300_000) return;
  lastPurge = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Rate limit all API routes
  if (path.startsWith("/api/")) {
    maybePurge();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    if (checkRateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  const token = req.cookies.get("token")?.value;
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
  matcher: ["/dashboard/:path*", "/admin/:path*", "/suspended", "/api/:path*"],
};