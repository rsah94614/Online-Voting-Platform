// app/api/candidates/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { approved, reason } = schema.parse(body);

  const candidate = await prisma.candidate.update({
    where: { id },
    data: { isApproved: approved },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  // Also update the User.isApproved if approving
  if (approved) {
    await prisma.user.update({ where: { id: candidate.userId }, data: { isApproved: true } });
  }

  await logAudit({
    userId: user.sub,
    action: approved ? AuditAction.CANDIDATE_APPROVED : AuditAction.CANDIDATE_REJECTED,
    resource: "candidate",
    resourceId: id,
    details: { name: candidate.user.name, approved, reason },
    req,
  });

  return NextResponse.json({ candidate });
}