// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { signToken, setAuthCookie, getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction, Role } from "@prisma/client";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(["ADMIN", "VOTER", "CANDIDATE", "PARTY_ADMIN"]).default("ADMIN"),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const adminUser = await getUserFromRequest(req);
    const body = await req.json();
    const data = schema.parse(body);

    // Security: If not logged in as Admin, you can ONLY register as an ADMIN
    if (!adminUser || adminUser.role !== "ADMIN") {
      if (data.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden: You can only register as an Admin." }, { status: 403 });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // If an Admin is creating this user, tie them to that Admin's tenant
    const adminId = (adminUser && adminUser.role === "ADMIN" && data.role !== "ADMIN") ? adminUser.sub : null;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        role: data.role as Role,
        isApproved: true, // Auto-approve everyone for now
        isVerified: false,
        adminId: adminId, // Link to the parent Admin tenant
      } as any,
    });

    // If candidate, create candidate profile
    if (data.role === "CANDIDATE") {
      await prisma.candidate.create({ data: { userId: user.id } });
    }

    // Log the audit event
    await logAudit({
      userId: adminUser ? adminUser.sub : user.id, // User auditing themselves if public registration
      action: AuditAction.USER_REGISTER,
      resource: "user",
      resourceId: user.id,
      details: { email: user.email, role: user.role, createdBy: adminUser ? adminUser.email : 'self' },
      req,
    });

    // If this is an Admin creating a user, send the welcome email
    if (adminUser) {
      sendWelcomeEmail(user.name, user.email, data.password, user.role).catch(() => {});
      return NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, isApproved: user.isApproved },
      }, { status: 201 });
    }

    // If this is a public Admin registration, log them in automatically
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