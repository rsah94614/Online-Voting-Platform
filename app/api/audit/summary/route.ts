// app/api/audit/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get date 24 hours ago
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalEvents, failedLogins, suspensions, votesCast] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: yesterday } } }),
    prisma.auditLog.count({ where: { action: "LOGIN_FAILED" as any, createdAt: { gte: yesterday } } }),
    prisma.auditLog.count({ where: { action: "USER_SUSPENDED", createdAt: { gte: yesterday } } }),
    prisma.auditLog.count({ where: { action: "VOTE_CAST", createdAt: { gte: yesterday } } }),
  ]);

  return NextResponse.json({
    totalEvents,
    failedLogins,
    suspensions,
    votesCast,
  });
}
