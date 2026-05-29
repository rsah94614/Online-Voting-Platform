// app/api/votes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { broadcast } from "@/lib/sse";
import { AuditAction, ElectionStatus } from "@prisma/client";

const schema = z.object({
  electionId: z.string(),
  electionCandidateId: z.string(),
});

// POST /api/votes - cast a vote
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "VOTER") return NextResponse.json({ error: "Only voters can cast votes" }, { status: 403 });

  try {
    const body = await req.json();
    const { electionId, electionCandidateId } = schema.parse(body);

    // Check election is LIVE
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) return NextResponse.json({ error: "Election not found" }, { status: 404 });
    if (election.status !== ElectionStatus.LIVE) {
      return NextResponse.json({ error: "Election is not currently active" }, { status: 409 });
    }

    // Check candidate exists in this election
    const ec = await prisma.electionCandidate.findFirst({
      where: { id: electionCandidateId, electionId },
      include: { candidate: { include: { user: { select: { name: true } } } } },
    });
    if (!ec) return NextResponse.json({ error: "Candidate not in this election" }, { status: 404 });

    // Check voter hasn't already voted
    const existing = await prisma.vote.findUnique({
      where: { voterId_electionId: { voterId: user.sub, electionId } },
    });
    if (existing) return NextResponse.json({ error: "You have already voted in this election" }, { status: 409 });

    // Check voter is approved
    const voter = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!voter?.isApproved) {
      return NextResponse.json({ error: "Your account is not approved for voting" }, { status: 403 });
    }

    // Generate an anonymous receipt hash (decoupled from precise timestamp to prevent timing correlation)
    const randomSalt = crypto.randomBytes(16).toString("hex");
    const receiptHash = crypto
      .createHash("sha256")
      .update(`${user.sub}:${electionId}:${randomSalt}:${process.env.JWT_SECRET ?? "secret"}`)
      .digest("hex");

    const vote = await prisma.vote.create({
      data: {
        voterId: user.sub,
        electionId,
        electionCandidateId,
        receiptHash,
      },
    });

    await logAudit({
      userId: user.sub,
      action: AuditAction.VOTE_CAST,
      resource: "vote",
      resourceId: electionId,
      details: { electionTitle: election.title }, // deliberately omit candidate
      req,
    });

    // Broadcast real-time update via SSE
    const updatedCandidates = await prisma.electionCandidate.findMany({
      where: { electionId },
      include: {
        candidate: { include: { user: { select: { name: true } }, party: { select: { name: true, color: true } } } },
        _count: { select: { votes: true } },
      },
    });
    const totalVotes = updatedCandidates.reduce((s, c) => s + c._count.votes, 0);

    broadcast(electionId, {
      type: "vote_update",
      electionId,
      totalVotes,
      candidates: [], // Deliberately hidden during LIVE election
      timestamp: Date.now(),
    });

    return NextResponse.json({
      ok: true,
      receiptHash: vote.receiptHash,
      message: "Your vote has been recorded securely.",
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.errors }, { status: 400 });
    }
    // Unique constraint = already voted
    if ((err as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "You have already voted in this election" }, { status: 409 });
    }
    console.error("[votes POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/votes?electionId=xxx - check if current user voted
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const electionId = req.nextUrl.searchParams.get("electionId");
  if (!electionId) return NextResponse.json({ error: "electionId required" }, { status: 400 });

  const vote = await prisma.vote.findUnique({
    where: { voterId_electionId: { voterId: user.sub, electionId } },
    select: { castAt: true, receiptHash: true },
  });

  return NextResponse.json({ voted: !!vote, vote: vote ?? null });
}