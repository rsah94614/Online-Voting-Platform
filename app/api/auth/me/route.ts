// app/api/auth/me/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, unauthorized, notFound, handleApiError } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser(req)
    if (!payload) return unauthorized()

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, email: true, name: true, role: true,
        phone: true, avatar: true, isVerified: true, nationality: true,
        dateOfBirth: true, createdAt: true,
        partyMembership: { include: { party: { select: { id: true, name: true, abbreviation: true, color: true } } } },
        candidateProfile: { select: { id: true, status: true, electionId: true, partyId: true } },
      },
    })
    if (!user) return notFound('User not found')

    return ok(user)
  } catch (e) {
    return handleApiError(e)
  }
}