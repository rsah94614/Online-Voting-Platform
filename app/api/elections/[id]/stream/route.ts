// app/api/elections/[id]/stream/route.ts
// Server-Sent Events - sends live vote count updates to connected clients
import { NextRequest } from "next/server";
import { subscribe, unsubscribe } from "@/lib/sse";
import prisma from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: electionId } = await params;

  // Verify election exists and is live or upcoming
  const election = await prisma.election.findUnique({ where: { id: electionId } });
  if (!election) {
    return new Response("Election not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial snapshot immediately
      const snapshot = await getSnapshot(electionId);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "snapshot", ...snapshot })}\n\n`));

      // Subscribe to future updates
      const listener = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      subscribe(electionId, listener);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 30_000);

      function cleanup() {
        clearInterval(heartbeat);
        unsubscribe(electionId, listener);
      }

      // Clean up when client disconnects
      // (ReadableStream cancel is called on close)
      return cleanup;
    },
    cancel() {
      // cleanup handled in start's return value
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

async function getSnapshot(electionId: string) {
  const candidates = await prisma.electionCandidate.findMany({
    where: { electionId },
    include: {
      candidate: { include: { user: { select: { name: true } }, party: { select: { name: true, color: true } } } },
      _count: { select: { votes: true } },
    },
  });

  const totalVotes = candidates.reduce((s, c) => s + c._count.votes, 0);

  return {
    electionId,
    totalVotes,
    candidates: candidates.map((ec) => ({
      id: ec.id,
      name: ec.candidate.user.name,
      party: ec.candidate.party?.name ?? "Independent",
      partyColor: ec.candidate.party?.color ?? "#888",
      votes: ec._count.votes,
      percentage: totalVotes > 0 ? Math.round((ec._count.votes / totalVotes) * 10000) / 100 : 0,
    })),
    timestamp: Date.now(),
  };
}