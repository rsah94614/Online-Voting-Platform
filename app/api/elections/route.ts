// app/api/elections/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ElectionStatus, ElectionType, VotingMethod, ResultDisclosure, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, created, unauthorized, forbidden, handleApiError } from '@/lib/response'

// ── GET /api/elections ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const status   = searchParams.get('status') as ElectionStatus | null
    const type     = searchParams.get('type') as ElectionType | null
    const search   = searchParams.get('search') ?? ''
    const page     = Math.max(1, Number(searchParams.get('page')   ?? 1))
    const pageSize = Math.min(50, Number(searchParams.get('pageSize') ?? 10))

    const where = {
      ...(status && status !== 'all' ? { status } : {}),
      ...(type   && type   !== 'all' ? { type }   : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
      // Non-admins only see non-draft elections
      ...(user.role !== Role.ADMIN ? { status: { not: ElectionStatus.DRAFT } } : {}),
    }

    const [elections, total] = await Promise.all([
      prisma.election.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { votes: true, candidates: true, voterRegistrations: true } },
          createdBy: { select: { name: true } },
        },
      }),
      prisma.election.count({ where }),
    ])

    return ok({ data: elections, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
  } catch (e) {
    return handleApiError(e)
  }
}

// ── POST /api/elections ───────────────────────────────────────────────────────
const createSchema = z.object({
  title:                z.string().min(5).max(200),
  description:          z.string().min(10),
  type:                 z.nativeEnum(ElectionType).default(ElectionType.CUSTOM),
  votingMethod:         z.nativeEnum(VotingMethod).default(VotingMethod.FPTP),
  resultDisclosure:     z.nativeEnum(ResultDisclosure).default(ResultDisclosure.AFTER_CLOSE),
  startDate:            z.string().datetime(),
  endDate:              z.string().datetime(),
  registrationDeadline: z.string().datetime().optional(),
  allowSplitVoting:     z.boolean().default(false),
  requirePhotoId:       z.boolean().default(false),
  anonymizeVoters:      z.boolean().default(true),
  maxCandidates:        z.number().int().positive().optional(),
  maxVoters:            z.number().int().positive().optional(),
  rounds:               z.number().int().min(1).default(1),
  constituencies: z.array(z.object({
    name:  z.string(),
    seats: z.number().int().min(1).default(1),
  })).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN)) return forbidden('Only admins can create elections')

    const body = createSchema.parse(await req.json())

    const start = new Date(body.startDate)
    const end   = new Date(body.endDate)
    if (end <= start) return forbidden('End date must be after start date') // using forbidden as "bad" response

    const election = await prisma.election.create({
      data: {
        title:                body.title,
        description:          body.description,
        type:                 body.type,
        votingMethod:         body.votingMethod,
        resultDisclosure:     body.resultDisclosure,
        startDate:            start,
        endDate:              end,
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
        allowSplitVoting:     body.allowSplitVoting,
        requirePhotoId:       body.requirePhotoId,
        anonymizeVoters:      body.anonymizeVoters,
        maxCandidates:        body.maxCandidates,
        maxVoters:            body.maxVoters,
        rounds:               body.rounds,
        status:               ElectionStatus.DRAFT,
        createdById:          user.sub,
        constituencies: body.constituencies ? {
          create: body.constituencies.map((c) => ({ name: c.name, seats: c.seats })),
        } : undefined,
      },
      include: { constituencies: true, _count: { select: { votes: true, candidates: true } } },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.sub, electionId: election.id,
        action: 'ELECTION_CREATED', entity: 'Election', entityId: election.id,
      },
    })

    return created(election, 'Election created successfully')
  } catch (e) {
    return handleApiError(e)
  }
}