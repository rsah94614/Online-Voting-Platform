// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { Role } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

// Routes that require authentication
const PROTECTED_UI_PREFIXES = ["/admin", "/voter", "/candidate", "/party"];

// API routes that DO NOT require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/verify",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/votes/status",
  "/api/analytics",
  "/api/verify",
];

// Role → allowed path prefixes
const ROLE_ROUTES: Record<Role, string[]> = {
  ADMIN: ["/admin", "/voter", "/candidate", "/party"],
  VOTER: ["/voter"],
  CANDIDATE: ["/candidate"],
  PARTY_ADMIN: ["/party"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Rate Limiting
  // Stricter limit for login/register/votes
  let rlConfig = { limit: 100, windowMs: 60 * 1000 }; // default 100 req/min
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/votes")) {
    rlConfig = { limit: 20, windowMs: 60 * 1000 }; // 20 req/min
  }

  const rlResult = rateLimit(ip, rlConfig);
  if (!rlResult.success) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    } else {
      // Return a simple 429 page or redirect
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  // 2. Authentication
  const isApi = pathname.startsWith("/api/");
  const isProtectedUI = PROTECTED_UI_PREFIXES.some((p) => pathname.startsWith(p));

  // If it's API, check if it's public. For /api/elections, GET is public, others protected.
  let requiresApiAuth = false;
  if (isApi) {
    const isPublic = PUBLIC_API_ROUTES.some(p => pathname.startsWith(p));
    const isPublicElectionGet = pathname.startsWith("/api/elections") && req.method === "GET";
    if (!isPublic && !isPublicElectionGet) {
      requiresApiAuth = true;
    }
  }

  if (!isProtectedUI && !requiresApiAuth) {
    return NextResponse.next();
  }

  const user = await getUserFromRequest(req);

  if (!user) {
    if (requiresApiAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. UI Role Authorization
  if (isProtectedUI) {
    const allowed = ROLE_ROUTES[user.role] ?? [];
    if (!allowed.some((p) => pathname.startsWith(p))) {
      // Redirect to their own dashboard
      const dashboardMap: Record<Role, string> = {
        ADMIN: "/admin",
        VOTER: "/voter",
        CANDIDATE: "/candidate",
        PARTY_ADMIN: "/party",
      };
      return NextResponse.redirect(new URL(dashboardMap[user.role], req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};