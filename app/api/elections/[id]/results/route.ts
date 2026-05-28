// app/api/elections/[id]/results/route.ts
import { NextRequest } from 'next/server'
import { ElectionStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, unauthorized, notFound, forbidden, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { id } = await params
    const election = await prisma.election.findUnique({
      where: { id },
      include: { candidates: { include: { user: { select: { name: true } }, party: { select: { name: true, abbreviation: true, color: true } } } } },
    })
    if (!election) return notFound()

    // Respect result disclosure settings
    if (
      election.status !== ElectionStatus.ENDED &&
      election.resultDisclosure === 'AFTER_CLOSE' &&
      user.role !== Role.ADMIN
    ) {
      return forbidden('Results will be disclosed after the election closes')
    }

    // Count votes per candidate
    const voteCounts = await prisma.vote.groupBy({
      by: ['candidateId'],
      where: { electionId: id },
      _count: { id: true },
    })

    const totalVotesCast   = voteCounts.reduce((sum, v) => sum + v._count.id, 0)
    const totalRegistered  = await prisma.voterRegistration.count({ where: { electionId: id } })
    const turnoutPercent   = totalRegistered > 0 ? (totalVotesCast / totalRegistered) * 100 : 0

    const candidateResults = election.candidates
      .map((c) => {
        const vc = voteCounts.find((v) => v.candidateId === c.id)
        const votes = vc?._count.id ?? 0
        return {
          candidateId:  c.id,
          name:         c.user.name,
          party:        c.party?.name ?? 'Independent',
          partyColor:   c.party?.color ?? '#94a3b8',
          votes,
          percentage:   totalVotesCast > 0 ? (votes / totalVotesCast) * 100 : 0,
        }
      })
      .sort((a, b) => b.votes - a.votes)
      .map((c, i) => ({ ...c, isLeading: i === 0 }))

    // Hourly turnout (last 12 hours)
    const hoursAgo12 = new Date(Date.now() - 12 * 60 * 60 * 1000)
    const hourlyRaw = await prisma.$queryRaw<{ hour: Date; count: bigint }[]>`
      SELECT date_trunc('hour', "castAt") as hour, count(*) as count
      FROM votes
      WHERE "electionId" = ${id} AND "castAt" > ${hoursAgo12}
      GROUP BY hour ORDER BY hour ASC
    `

    return ok({
      electionId:    id,
      title:         election.title,
      status:        election.status,
      totalVoters:   totalRegistered,
      totalVotesCast,
      turnoutPercent: Math.round(turnoutPercent * 10) / 10,
      lastUpdated:   new Date().toISOString(),
      candidateResults,
      turnoutByHour: hourlyRaw.map((h) => ({
        time:  h.hour.toISOString(),
        votes: Number(h.count),
      })),
    })
  } catch (e) {
    return handleApiError(e)
  }
}