// app/api/votes/cast/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ElectionStatus, Role, AuditAction } from '@prisma/client'
import prisma from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { created, unauthorized, badRequest, conflict, notFound, forbidden, handleApiError } from '@/lib/response'
import { nanoid } from 'nanoid'

const schema = z.object({
  electionId:          z.string().min(1),
  electionCandidateId: z.string().min(1),   // must be an ElectionCandidate id
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (user.role === Role.ADMIN) return forbidden('Admins cannot cast votes')

    const { electionId, electionCandidateId } = schema.parse(await req.json())

    // ── 1. Election must exist and be LIVE ────────────────────────────────────
    const election = await prisma.election.findUnique({ where: { id: electionId } })
    if (!election) return notFound('Election not found')
    if (election.status !== ElectionStatus.LIVE) {
      return badRequest('Election is not currently accepting votes')
    }

    const now = new Date()
    if (now < election.startDate) return badRequest('Voting has not started yet')
    if (now > election.endDate)   return badRequest('Voting has ended')

    // ── 2. Already voted? ─────────────────────────────────────────────────────
    const existingVote = await prisma.vote.findUnique({
      where: { voterId_electionId: { voterId: user.sub, electionId } },
    })
    if (existingVote) return conflict('You have already voted in this election')

    // ── 3. Validate the ElectionCandidate belongs to this election ────────────
    const electionCandidate = await prisma.electionCandidate.findFirst({
      where: {
        id: electionCandidateId,
        electionId,
        candidate: { isApproved: true },
      },
      include: { candidate: true },
    })
    if (!electionCandidate) return notFound('Candidate not found or not approved for this election')

    // ── 4. Cast vote ──────────────────────────────────────────────────────────
    const receipt = `RCPT-${nanoid(10).toUpperCase()}`

    const vote = await prisma.vote.create({
      data: {
        electionId,
        electionCandidateId,
        voterId: user.sub,
        receiptHash: receipt,
      },
    })

    // ── 5. Audit log ──────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        userId:    user.sub,
        action:    AuditAction.VOTE_CAST,
        resource:  'vote',
        resourceId: vote.id,
        details:   { receipt, electionId, electionCandidateId },
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
      },
    })

    return created({ receipt, castAt: vote.castAt }, 'Vote cast successfully')
  } catch (e) {
    return handleApiError(e)
  }
}