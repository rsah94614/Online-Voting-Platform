// app/api/audit/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { AuditAction } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const actionRaw = searchParams.get("action");
  const action = actionRaw === "all" ? null : (actionRaw as AuditAction | null);
  const userId = searchParams.get("userId");
  const search = searchParams.get("search");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
  };

  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000, // Safe limit for memory
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  const header = ["ID", "Timestamp", "Action", "Resource", "ResourceID", "User Name", "User Email", "IP Address"];
  const rows = logs.map(log => [
    log.id,
    log.createdAt.toISOString(),
    log.action,
    log.resource,
    log.resourceId || "",
    log.user?.name || "",
    log.user?.email || "",
    log.ipAddress || "",
  ]);

  const csvContent = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="votex_audit_export_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
