// app/api/elections/[id]/candidates/route.ts
import { NextRequest } from 'next/server'
import { CandidateStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, unauthorized, notFound, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { id } = await params
    const election = await prisma.election.findUnique({ where: { id } })
    if (!election) return notFound()

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') as CandidateStatus | null

    const candidates = await prisma.candidateProfile.findMany({
      where: {
        electionId: id,
        ...(statusFilter ? { status: statusFilter } : {}),
        // Non-admins only see approved candidates
        ...(user.role !== Role.ADMIN ? { status: CandidateStatus.APPROVED } : {}),
      },
      include: {
        user:  { select: { id: true, name: true, email: true, avatar: true } },
        party: { select: { id: true, name: true, abbreviation: true, color: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Attach vote percentages
    const totalVotes = await prisma.vote.count({ where: { electionId: id } })
    const enriched = candidates.map((c) => ({
      ...c,
      voteCount:      c._count.votes,
      votePercentage: totalVotes > 0 ? Math.round((c._count.votes / totalVotes) * 1000) / 10 : 0,
    }))

    return ok(enriched)
  } catch (e) {
    return handleApiError(e)
  }
}