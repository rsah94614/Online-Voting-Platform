// app/api/elections/[id]/launch/route.ts
import { NextRequest } from 'next/server'
import { ElectionStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, badRequest, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN)) return forbidden()

    const { id } = await params
    const election = await prisma.election.findUnique({
      where: { id },
      include: { _count: { select: { candidates: true } } },
    })
    if (!election) return notFound()
    if (election.status === ElectionStatus.LIVE) return badRequest('Already live')
    if (election.status === ElectionStatus.ENDED) return badRequest('Election has ended')
    if (election._count.candidates < 2) return badRequest('At least 2 approved candidates required to launch')

    const approved = await prisma.candidateProfile.count({
      where: { electionId: id, status: 'APPROVED' },
    })
    if (approved < 2) return badRequest('At least 2 approved candidates required')

    const launched = await prisma.election.update({
      where: { id },
      data: { status: ElectionStatus.LIVE, launchedAt: new Date() },
    })

    await prisma.auditLog.create({
      data: { userId: user.sub, electionId: id, action: 'ELECTION_LAUNCHED', entity: 'Election', entityId: id },
    })

    return ok(launched, '🚀 Election is now LIVE!')
  } catch (e) {
    return handleApiError(e)
  }
}