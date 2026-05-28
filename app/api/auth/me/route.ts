// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getUserFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: token.sub },
    select: {
      id: true, email: true, name: true, role: true,
      isApproved: true, isVerified: true, avatarUrl: true,
      phone: true, createdAt: true,
      candidate: { select: { id: true, isApproved: true, partyId: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}