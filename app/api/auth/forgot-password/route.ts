// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true, message: "If that email exists, a reset code has been sent." });
    }

    // Rate limit: check if there's a recent unused OTP (within 2 minutes)
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        used: false,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      return NextResponse.json({
        ok: true,
        message: "A reset code was recently sent. Please wait 2 minutes before requesting another.",
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Expire any old unused OTPs for this user
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Create new OTP
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        email: user.email,
        code: otp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send OTP email
    await sendOtpEmail(user.name, user.email, otp);

    console.log(`[forgot-password] OTP for ${email}: ${otp}`); // Dev fallback

    return NextResponse.json({ ok: true, message: "If that email exists, a reset code has been sent." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
