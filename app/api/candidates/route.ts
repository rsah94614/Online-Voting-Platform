// app/api/candidates/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const approved = searchParams.get("approved");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const where: any = approved !== null ? { isApproved: approved === "true" } : {};
  if (user.role === "ADMIN") {
    where.user = { adminId: user.sub }; // Multi-tenant isolation
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
        party: { select: { name: true, abbreviation: true, color: true } },
        nominations: { select: { electionId: true } },
      },
    }),
    prisma.candidate.count({ where }),
  ]);

  return NextResponse.json({ candidates, total });
}