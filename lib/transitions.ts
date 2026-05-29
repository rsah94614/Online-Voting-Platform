// lib/transitions.ts
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { AuditAction, ElectionStatus } from "@prisma/client";
import { sendResultsNotification } from "@/lib/email";

/**
 * Transitions elections:
 * - UPCOMING → LIVE when startDate <= now
 * - LIVE → ENDED when endDate <= now
 */
export async function transitionElections() {
  const now = new Date();
  let transitioned = 0;

  // UPCOMING → LIVE
  const toGoLive = await prisma.election.findMany({
    where: { status: ElectionStatus.UPCOMING, startDate: { lte: now } },
  });

  for (const election of toGoLive) {
    await prisma.election.update({
      where: { id: election.id },
      data: { status: ElectionStatus.LIVE },
    });
    await logAudit({
      action: AuditAction.ELECTION_LAUNCHED,
      resource: "election",
      resourceId: election.id,
      details: { title: election.title, method: "auto_transition" },
    } as any);
    transitioned++;
  }

  // LIVE → ENDED
  const toEnd = await prisma.election.findMany({
    where: { status: ElectionStatus.LIVE, endDate: { lte: now } },
    include: {
      enrolledVoters: { select: { name: true, email: true } },
      candidates: {
        include: {
          candidate: { include: { user: { select: { name: true } } } },
          _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: "desc" } },
      },
    } as any,
  });

  for (const rawElection of toEnd) {
    const election: any = rawElection;
    await prisma.election.update({
      where: { id: election.id },
      data: { status: ElectionStatus.ENDED },
    });
    await logAudit({
      action: AuditAction.ELECTION_ENDED,
      resource: "election",
      resourceId: election.id,
      details: { title: election.title, method: "auto_transition" },
    } as any);

    // Send results notification to enrolled voters
    const winnerName = election.candidates?.[0]?.candidate?.user?.name || "N/A";
    if (election.enrolledVoters) {
      for (const voter of election.enrolledVoters) {
        // Fire and forget — don't block the transition
        sendResultsNotification(voter.name, voter.email, election.title, winnerName).catch(() => {});
      }
    }

    transitioned++;
  }

  return { transitioned, goLive: toGoLive.length, ended: toEnd.length };
}
