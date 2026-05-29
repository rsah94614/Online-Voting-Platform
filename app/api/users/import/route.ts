import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const admin = await getUserFromRequest(req);
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Only admins can import users" }, { status: 403 });
  }

  try {
    const { csvData } = await req.json();
    if (!csvData) return NextResponse.json({ error: "Missing csvData" }, { status: 400 });

    const lines = csvData.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    // Skip header row if present
    if (lines[0].toLowerCase().includes("email")) {
      lines.shift();
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const line of lines) {
      const parts = line.split(",").map((i: string) => i.trim());
      const name = parts[0];
      const email = parts[1];
      const password = parts[2] || "Voter@1234"; // Default fallback if missing

      if (!name || !email) {
        errors.push(`Invalid format on line (missing name/email): ${line}`);
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        errors.push(`Skipped (already exists): ${email}`);
        continue;
      }

      try {
        const passwordHash = await bcrypt.hash(password, 12);
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "VOTER",
            isApproved: true,
            isVerified: false,
          }
        });
        successCount++;
      } catch (err: any) {
        errors.push(`Failed to create ${email}: ${err.message}`);
      }
    }

    return NextResponse.json({ successCount, errors }, { status: 200 });
  } catch (err) {
    console.error("[CSV Import]", err);
    return NextResponse.json({ error: "Internal server error processing CSV" }, { status: 500 });
  }
}
