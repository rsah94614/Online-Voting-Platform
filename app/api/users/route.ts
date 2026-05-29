// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const role = searchParams.get("role") as Role | null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const search = searchParams.get("q") ?? "";
  const limit = 20;

  const where: any = {
    adminId: user.sub, // Multi-tenant isolation
    ...(role ? { role } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, role: true,
        isApproved: true, isVerified: true, isSuspended: true,
        createdAt: true, avatarUrl: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

// PATCH /api/users - update user (suspend/unsuspend/approve)
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Whitelist updatable fields
  const allowed = ["isApproved", "isSuspended", "isVerified"] as const;
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in updates) data[k] = updates[k];
  }

  // Verify ownership
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || (target as any).adminId !== user.sub) {
    return NextResponse.json({ error: "Forbidden or Not Found" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, isApproved: true, isSuspended: true },
  });

  return NextResponse.json({ user: updated });
}