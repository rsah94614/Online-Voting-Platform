// app/api/elections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction, ElectionStatus, ElectionType, Prisma } from "@prisma/client";

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  type: z.nativeEnum(ElectionType),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  candidateIds: z.array(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});

// GET /api/elections - list elections
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as ElectionStatus | null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  const where = status ? { status } : {};

  const [elections, total] = await Promise.all([
    prisma.election.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        candidates: {
          include: {
            candidate: {
              include: { user: { select: { name: true, avatarUrl: true } }, party: { select: { name: true, color: true } } },
            },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.election.count({ where }),
  ]);

  return NextResponse.json({ elections, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/elections - create election (ADMIN only)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    const now = new Date();
    const startDate = new Date(data.startDate);
    const status: ElectionStatus = startDate > now ? ElectionStatus.UPCOMING : ElectionStatus.DRAFT;

    const election = await prisma.election.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status,
        startDate: startDate,
        endDate: new Date(data.endDate),
        settings: data.settings !== undefined ? (data.settings as Prisma.InputJsonValue) : undefined,
        candidates: data.candidateIds?.length
          ? { create: data.candidateIds.map((id) => ({ candidateId: id })) }
          : undefined,
      },
      include: { candidates: { include: { candidate: true } } },
    });

    await logAudit({
      userId: user.sub, action: AuditAction.ELECTION_CREATED,
      resource: "election", resourceId: election.id,
      details: { title: election.title }, req,
    });

    return NextResponse.json({ election }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    console.error("[elections POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}