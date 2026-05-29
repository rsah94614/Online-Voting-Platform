// app/api/elections/[id]/candidates/route.ts
import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
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
    const statusFilter = searchParams.get('status')
    const isApprovedFilter = statusFilter ? statusFilter.toUpperCase() === 'APPROVED' : null

    const candidates = await prisma.candidate.findMany({
      where: {
        nominations: {
          some: {
            electionId: id,
          }
        },
        ...(isApprovedFilter !== null ? { isApproved: isApprovedFilter } : {}),
        // Non-admins only see approved candidates
        ...(user.role !== Role.ADMIN ? { isApproved: true } : {}),
      },
      include: {
        user:  { select: { id: true, name: true, email: true, avatarUrl: true } },
        party: { select: { id: true, name: true, abbreviation: true, color: true } },
        nominations: {
          where: { electionId: id },
          include: {
            _count: { select: { votes: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    })

    // Attach vote percentages
    const totalVotes = await prisma.vote.count({ where: { electionId: id } })
    const enriched = candidates.map((c) => {
      const voteCount = c.nominations[0]?._count?.votes ?? 0
      const assetDeclObj = c.assetDecl && typeof c.assetDecl === 'object'
        ? (c.assetDecl as Record<string, unknown>)
        : {}

      return {
        ...c,
        status: c.isApproved ? 'APPROVED' : 'PENDING',
        biography: c.bio,
        ...assetDeclObj,
        voteCount,
        votePercentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 1000) / 10 : 0,
      }
    })

    return ok(enriched)
  } catch (e) {
    return handleApiError(e)
  }
}