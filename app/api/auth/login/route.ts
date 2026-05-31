// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes.
  // This also limits how often bcrypt.compare() runs per IP,
  // preventing brute-force attacks and CPU spikes from failed attempts.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const rl = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again in 15 minutes." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.isSuspended) {
      return NextResponse.json({ error: "Account suspended. Contact support." }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await logAudit({
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      resource: "auth",
      details: { email: user.email },
      req,
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isApproved: user.isApproved,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
      },
    });

    setAuthCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}