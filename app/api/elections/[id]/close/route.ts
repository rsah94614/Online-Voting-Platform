// app/api/elections/[id]/close/route.ts
import { NextRequest } from 'next/server'
import { ElectionStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, badRequest, handleApiError } from '@/lib/response'
import { sendResultsNotification } from '@/lib/email'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN)) return forbidden()

    const { id } = await params
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        enrolledVoters: { select: { name: true, email: true } },
        candidates: {
          include: {
            candidate: { include: { user: { select: { name: true } } } },
            _count: { select: { votes: true } },
          },
          orderBy: { votes: { _count: 'desc' } },
        },
      }
    })
    if (!election) return notFound()
    if (election.status === ElectionStatus.ENDED) return badRequest('Already ended')
    if (election.status === ElectionStatus.DRAFT) return badRequest('Election was never launched')

    const closed = await prisma.election.update({
      where: { id },
      data: { status: ElectionStatus.ENDED },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.sub,
        action: 'ELECTION_ENDED',
        resource: 'election',
        resourceId: id,
      },
    })

    // Send results notification to enrolled voters
    const winnerName = election.candidates[0]?.candidate.user.name || "N/A";
    for (const voter of election.enrolledVoters) {
      sendResultsNotification(voter.name, voter.email, election.title, winnerName).catch(() => {});
    }

    return ok(closed, 'Election closed and results finalised')
  } catch (e) {
    return handleApiError(e)
  }
}