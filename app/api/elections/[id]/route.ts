// app/api/elections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction, ElectionStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(ElectionStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settings: z.record(z.unknown()).optional(),
  candidateIds: z.array(z.string()).optional(),
}).strict();

// GET /api/elections/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          candidate: {
            include: {
              user: { select: { name: true, avatarUrl: true, email: true } },
              party: { select: { name: true, abbreviation: true, color: true } },
            },
          },
          _count: { select: { votes: true } },
        },
      },
      _count: { select: { votes: true } },
    },
  });

  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ election });
}

// PATCH /api/elections/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const { candidateIds, ...rest } = data;

    const updated = await prisma.election.update({
      where: { id },
      data: {
        ...rest,
        startDate: rest.startDate ? new Date(rest.startDate) : undefined,
        endDate: rest.endDate ? new Date(rest.endDate) : undefined,
        ...(candidateIds !== undefined && {
          candidates: {
            deleteMany: {},
            create: candidateIds.map((cid) => ({ candidateId: cid })),
          },
        }),
      },
      include: { candidates: true },
    });

    const action =
      data.status === ElectionStatus.LIVE ? AuditAction.ELECTION_LAUNCHED :
      data.status === ElectionStatus.ENDED ? AuditAction.ELECTION_ENDED :
      AuditAction.ELECTION_UPDATED;

    await logAudit({ userId: user.sub, action, resource: "election", resourceId: id, details: data as Record<string, unknown>, req });

    return NextResponse.json({ election: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    console.error("[elections PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/elections/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent deleting LIVE elections
  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (election.status === ElectionStatus.LIVE) {
    return NextResponse.json({ error: "Cannot delete a live election. End it first." }, { status: 409 });
  }

  await prisma.election.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}