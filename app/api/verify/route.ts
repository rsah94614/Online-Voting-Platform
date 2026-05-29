// app/api/verify/route.ts — Public verification endpoint
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");

  if (type === "election") {
    const code = searchParams.get("code")?.toUpperCase();
    if (!code || code.length < 6) {
      return NextResponse.json({ error: "Invalid election code" }, { status: 400 });
    }

    const election = await prisma.election.findUnique({
      where: { searchCode: code },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        searchCode: true,
        _count: {
          select: {
            candidates: true,
            votes: true,
            enrolledVoters: true,
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json({ found: false, error: "No election found with that code" }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      election: {
        title: election.title,
        type: election.type,
        status: election.status,
        searchCode: election.searchCode,
        startDate: election.startDate,
        endDate: election.endDate,
        candidateCount: election._count.candidates,
        voterCount: election._count.enrolledVoters,
        totalVotes: election.status === "ENDED" ? election._count.votes : null,
      },
    });
  }

  if (type === "receipt") {
    const hash = searchParams.get("hash");
    if (!hash || hash.length < 10) {
      return NextResponse.json({ error: "Invalid receipt hash" }, { status: 400 });
    }

    const vote = await prisma.vote.findUnique({
      where: { receiptHash: hash },
      select: {
        castAt: true,
        election: {
          select: { title: true, status: true },
        },
      },
    });

    if (!vote) {
      return NextResponse.json({ valid: false, message: "No vote found with this receipt hash" });
    }

    return NextResponse.json({
      valid: true,
      castAt: vote.castAt,
      electionTitle: vote.election.title,
      electionStatus: vote.election.status,
      message: "This vote receipt is valid and has been recorded in our system.",
    });
  }

  return NextResponse.json({ error: "Invalid type. Use type=election or type=receipt" }, { status: 400 });
}
