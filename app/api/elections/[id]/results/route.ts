// app/api/elections/[id]/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          candidate: {
            include: {
              user: { select: { name: true, avatarUrl: true } },
              party: { select: { name: true, abbreviation: true, color: true } },
            },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: "desc" } },
      },
      _count: { select: { votes: true } },
    },
  });

  if (!election) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalVotes = election._count.votes;

  const results = election.candidates.map((ec) => ({
    electionCandidateId: ec.id,
    candidateId: ec.candidateId,
    name: ec.candidate.user.name,
    avatarUrl: ec.candidate.user.avatarUrl,
    party: ec.candidate.party,
    votes: ec._count.votes,
    percentage: totalVotes > 0 ? Math.round((ec._count.votes / totalVotes) * 10000) / 100 : 0,
  }));

  // Sort desc
  results.sort((a, b) => b.votes - a.votes);
  const winner = results[0] ?? null;

  return NextResponse.json({
    election: {
      id: election.id,
      title: election.title,
      status: election.status,
      startDate: election.startDate,
      endDate: election.endDate,
      totalVoters: election.totalVoters,
    },
    results,
    totalVotes,
    turnout: election.totalVoters > 0
      ? Math.round((totalVotes / election.totalVoters) * 10000) / 100
      : null,
    winner: election.status === "ENDED" ? winner : null,
  });
}