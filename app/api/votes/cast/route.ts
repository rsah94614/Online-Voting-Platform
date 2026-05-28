// app/api/votes/cast/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ElectionStatus, CandidateStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { created, unauthorized, badRequest, conflict, notFound, forbidden, handleApiError } from '@/lib/response'
import { nanoid } from 'nanoid'

const schema = z.object({
  electionId:  z.string().min(1),
  candidateId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (user.role === Role.ADMIN) return forbidden('Admins cannot cast votes')

    const { electionId, candidateId } = schema.parse(await req.json())

    // Election checks
    const election = await prisma.election.findUnique({ where: { id: electionId } })
    if (!election) return notFound('Election not found')
    if (election.status !== ElectionStatus.LIVE) return badRequest('Election is not currently accepting votes')

    const now = new Date()
    if (now < election.startDate) return badRequest('Voting has not started yet')
    if (now > election.endDate)   return badRequest('Voting has ended')

    // Voter registration check
    const registration = await prisma.voterRegistration.findUnique({
      where: { userId_electionId: { userId: user.sub, electionId } },
    })
    if (!registration) return forbidden('You are not registered to vote in this election')
    if (!registration.isVerified) return forbidden('Your voter registration is not verified')

    // Already voted?
    const existingVote = await prisma.vote.findUnique({
      where: { voterId_electionId: { voterId: user.sub, electionId } },
    })
    if (existingVote) return conflict('You have already voted in this election')

    // Candidate validity
    const candidate = await prisma.candidateProfile.findFirst({
      where: { id: candidateId, electionId, status: CandidateStatus.APPROVED },
    })
    if (!candidate) return notFound('Candidate not found or not approved')

    // Cast vote
    const receipt = `RCPT-${nanoid(10).toUpperCase()}`
    const ipHash  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    const vote = await prisma.vote.create({
      data: {
        electionId,
        candidateId,
        voterId: user.sub,
        receipt,
        ipHash,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId:    user.sub,
        electionId,
        action:   'VOTE_CAST',
        entity:   'Vote',
        entityId: vote.id,
        metadata: { receipt },
      },
    })

    return created({ receipt, castAt: vote.castAt }, 'Vote cast successfully')
  } catch (e) {
    return handleApiError(e)
  }
}