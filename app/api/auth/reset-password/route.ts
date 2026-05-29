// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = schema.parse(body);

    // Find the OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid or expired code. Please request a new one." }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and mark OTP as used (in transaction)
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { id: otp.userId },
        data: { passwordHash },
      }),
      prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      }),
    ]);

    await logAudit({
      userId: user.id,
      action: AuditAction.SETTINGS_CHANGED,
      resource: "password_reset",
      resourceId: user.id,
      details: { method: "otp" },
      req,
    });

    return NextResponse.json({ ok: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
