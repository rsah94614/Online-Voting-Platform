// app/api/elections/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction, ElectionStatus, ElectionType, Prisma, Role } from "@prisma/client";
import crypto from "crypto";

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
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Auto-transition elections based on dates (UPCOMING→LIVE, LIVE→ENDED)
  try {
    const { transitionElections } = await import("@/lib/transitions");
    await transitionElections();
  } catch (e) {
    console.error("[elections GET] transition error:", e);
  }

  const { searchParams } = req.nextUrl;
  const statusRaw = searchParams.get("status");
  const status = statusRaw ? (statusRaw.toUpperCase() as ElectionStatus) : null;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  // If user is VOTER, only show elections they are enrolled in
  const where: any = status ? { status } : {};
  if (user.role === Role.VOTER) {
    where.enrolledVoters = { some: { id: user.sub } };
  } else if (user.role === Role.ADMIN) {
    where.adminId = user.sub; // Multi-tenant isolation
  }

  const [electionsData, total] = await Promise.all([
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

  // Strip candidate counts if the election is LIVE and user is not ADMIN
  const elections = electionsData.map(election => {
    if (election.status !== ElectionStatus.ENDED && user.role !== Role.ADMIN) {
      // Hide counts
      election.candidates = election.candidates.map(c => ({
        ...c,
        _count: { votes: 0 } // Hide real votes
      }));
    }
    return election;
  });

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

    // Generate a 6-character unique search code
    const searchCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const election = await prisma.election.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status,
        searchCode,
        startDate: startDate,
        endDate: new Date(data.endDate),
        adminId: user.sub, // Multi-tenant isolation
        settings: data.settings !== undefined ? (data.settings as Prisma.InputJsonValue) : undefined,
        candidates: data.candidateIds?.length
          ? { create: data.candidateIds.map((id) => ({ candidateId: id })) }
          : undefined,
      } as any,
      include: { candidates: { include: { candidate: true } } },
    });

    await logAudit({
      userId: user.sub, action: AuditAction.ELECTION_CREATED,
      resource: "election", resourceId: election.id,
      details: { title: election.title, searchCode: (election as any).searchCode }, req,
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