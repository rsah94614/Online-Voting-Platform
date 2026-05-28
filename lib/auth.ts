// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import type { Role } from '@prisma/client'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-secret-change-in-production-min-32-chars'
)

const COOKIE_NAME = 'votex_token'
const EXPIRES_IN  = '7d'

export interface JWTPayload {
  sub: string       // userId
  email: string
  name: string
  role: Role
  iat?: number
  exp?: number
}

// ── Sign ──────────────────────────────────────────────────────────────────────
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET)
}

// ── Verify ────────────────────────────────────────────────────────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// ── Set cookie ────────────────────────────────────────────────────────────────
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

// ── Clear cookie ──────────────────────────────────────────────────────────────
export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// ── Get current user from request ─────────────────────────────────────────────
export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  // 1. Try cookie
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value
  if (cookieToken) return verifyToken(cookieToken)

  // 2. Try Authorization header
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7))
  }

  return null
}

// ── Get current user from server component ────────────────────────────────────
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ── Role guards ───────────────────────────────────────────────────────────────
export function requireRole(user: JWTPayload | null, ...roles: Role[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}