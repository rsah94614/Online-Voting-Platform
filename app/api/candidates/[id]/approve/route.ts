// app/api/candidates/[id]/approve/route.ts
import { NextRequest } from 'next/server'
import { CandidateStatus, Role } from '@prisma/client'
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
    const candidate = await prisma.candidateProfile.findUnique({ where: { id } })
    if (!candidate) return notFound()
    if (candidate.status === CandidateStatus.APPROVED) return badRequest('Already approved')

    const updated = await prisma.candidateProfile.update({
      where: { id },
      data:  { status: CandidateStatus.APPROVED },
    })

    await prisma.auditLog.create({
      data: { userId: user.sub, action: 'CANDIDATE_APPROVED', entity: 'Candidate', entityId: id },
    })

    return ok(updated, 'Candidate approved')
  } catch (e) {
    return handleApiError(e)
  }
}