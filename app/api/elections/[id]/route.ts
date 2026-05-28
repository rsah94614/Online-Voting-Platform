// app/api/elections/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ElectionStatus, Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, badRequest, noContent, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

// ── GET /api/elections/[id] ──────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { id } = await params
    const election = await prisma.election.findUnique({
      where: { id },
      include: {
        createdBy:     { select: { id: true, name: true } },
        constituencies: true,
        candidates: {
          include: {
            user:  { select: { name: true, email: true } },
            party: { select: { name: true, abbreviation: true, color: true } },
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true, voterRegistrations: true } },
      },
    })
    if (!election) return notFound('Election not found')

    // Non-admin: hide DRAFT
    if (user.role !== Role.ADMIN && election.status === ElectionStatus.DRAFT) {
      return notFound('Election not found')
    }

    return ok(election)
  } catch (e) {
    return handleApiError(e)
  }
}

// ── PATCH /api/elections/[id] ────────────────────────────────────────────────
const updateSchema = z.object({
  title:                z.string().min(5).max(200).optional(),
  description:          z.string().optional(),
  startDate:            z.string().datetime().optional(),
  endDate:              z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().optional(),
  allowSplitVoting:     z.boolean().optional(),
  requirePhotoId:       z.boolean().optional(),
  anonymizeVoters:      z.boolean().optional(),
  maxCandidates:        z.number().int().positive().optional(),
  maxVoters:            z.number().int().positive().optional(),
}).strict()

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN)) return forbidden()

    const { id } = await params
    const existing = await prisma.election.findUnique({ where: { id } })
    if (!existing) return notFound()
    if (existing.status === ElectionStatus.LIVE) return badRequest('Cannot edit a live election')

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.election.update({
      where: { id },
      data: {
        ...body,
        ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
        ...(body.endDate   ? { endDate:   new Date(body.endDate) }   : {}),
        ...(body.registrationDeadline ? { registrationDeadline: new Date(body.registrationDeadline) } : {}),
      },
    })

    await prisma.auditLog.create({
      data: { userId: user.sub, electionId: id, action: 'ELECTION_UPDATED', entity: 'Election', entityId: id },
    })

    return ok(updated, 'Election updated')
  } catch (e) {
    return handleApiError(e)
  }
}

// ── DELETE /api/elections/[id] ───────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN)) return forbidden()

    const { id } = await params
    const existing = await prisma.election.findUnique({ where: { id } })
    if (!existing) return notFound()
    if (existing.status === ElectionStatus.LIVE) return badRequest('Cannot delete a live election — close it first')

    await prisma.election.delete({ where: { id } })
    return noContent()
  } catch (e) {
    return handleApiError(e)
  }
}