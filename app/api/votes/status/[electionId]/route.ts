// app/api/votes/status/[electionId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, unauthorized, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ electionId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { electionId } = await params

    const vote = await prisma.vote.findUnique({
      where: { voterId_electionId: { voterId: user.sub, electionId } },
      select: { receipt: true, castAt: true },
    })

    const registration = await prisma.voterRegistration.findUnique({
      where: { userId_electionId: { userId: user.sub, electionId } },
      select: { isVerified: true },
    })

    return ok({
      hasVoted:     !!vote,
      receipt:      vote?.receipt ?? null,
      castAt:       vote?.castAt  ?? null,
      isRegistered: !!registration,
      isVerified:   registration?.isVerified ?? false,
    })
  } catch (e) {
    return handleApiError(e)
  }
}