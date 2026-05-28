// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction, Role } from "@prisma/client";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(["VOTER", "CANDIDATE", "PARTY_ADMIN"]).default("VOTER"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role as Role,
        // Voters auto-approved; others need admin approval
        isApproved: data.role === "VOTER",
        isVerified: false,
      },
    });

    // If candidate, create candidate profile
    if (data.role === "CANDIDATE") {
      await prisma.candidate.create({ data: { userId: user.id } });
    }

    await logAudit({
      userId: user.id,
      action: AuditAction.USER_REGISTER,
      resource: "user",
      resourceId: user.id,
      details: { email: user.email, role: user.role },
      req,
    });

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role });

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved },
      requiresApproval: !user.isApproved,
    }, { status: 201 });

    setAuthCookie(res, token);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}