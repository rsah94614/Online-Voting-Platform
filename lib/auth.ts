// lib/auth.ts - JWT helpers using jose
import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION_32chars!!"
);
const COOKIE_NAME = "votex_token";
const EXPIRY = "7d";

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// Sign a new JWT
export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

// Verify and decode a JWT string
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// Get token from cookie jar (server component / route handler)
export async function getTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}

// Get current user from cookie (server component / route handler)
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyToken(token);
}

// Get current user from a request object (middleware / route handler)
export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token =
    req.cookies.get(COOKIE_NAME)?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token);
}

// Alias for API routes (getAuthUser = getUserFromRequest)
export const getAuthUser = getUserFromRequest;

// Check if user has specific role
export function requireRole(user: JWTPayload | null, ...requiredRoles: Role[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

// Set auth cookie in a Response
export function setAuthCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
  );
}

// Clear auth cookie
export function clearAuthCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`
  );
}

export { COOKIE_NAME };