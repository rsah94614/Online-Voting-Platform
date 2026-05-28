// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { Role } from "@prisma/client";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/admin", "/voter", "/candidate", "/party"];

// Role → allowed path prefixes
const ROLE_ROUTES: Record<Role, string[]> = {
  ADMIN: ["/admin", "/voter", "/candidate", "/party"],
  VOTER: ["/voter"],
  CANDIDATE: ["/candidate"],
  PARTY_ADMIN: ["/party"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const user = await getUserFromRequest(req);

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/voter/:path*", "/candidate/:path*", "/party/:path*"],
};