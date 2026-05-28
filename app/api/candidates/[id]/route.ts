// app/api/candidates/[id]/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, unauthorized, forbidden, notFound, handleApiError } from '@/lib/response'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { id } = await params
    const candidate = await prisma.candidateProfile.findUnique({
      where: { id },
      include: {
        user:     { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        party:    { select: { id: true, name: true, abbreviation: true, color: true } },
        election: { select: { id: true, title: true, status: true } },
        _count: { select: { votes: true } },
      },
    })
    if (!candidate) return notFound()
    return ok(candidate)
  } catch (e) {
    return handleApiError(e)
  }
}

const updateSchema = z.object({
  biography:       z.string().optional(),
  manifesto:       z.string().optional(),
  education:       z.unknown().optional(),
  workExperience:  z.unknown().optional(),
  politicalHistory:z.unknown().optional(),
  achievements:    z.array(z.string()).optional(),
  keyPolicies:     z.unknown().optional(),
  assetDeclarations:   z.unknown().optional(),
  fundingDeclarations: z.unknown().optional(),
  website:         z.string().url().optional().or(z.literal('')),
  socialLinks:     z.record(z.string()).optional(),
  constituency:    z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const { id } = await params
    const existing = await prisma.candidateProfile.findUnique({ where: { id } })
    if (!existing) return notFound()

    // Allow own candidate or admin
    if (existing.userId !== user.sub && !requireRole(user, Role.ADMIN)) return forbidden()

    const body = updateSchema.parse(await req.json())
    const updated = await prisma.candidateProfile.update({
      where: { id },
      data: {
        ...body,
        ...(body.education       ? { education:       body.education as object }        : {}),
        ...(body.workExperience  ? { workExperience:  body.workExperience as object }   : {}),
        ...(body.politicalHistory? { politicalHistory:body.politicalHistory as object } : {}),
        ...(body.keyPolicies     ? { keyPolicies:     body.keyPolicies as object }      : {}),
        ...(body.assetDeclarations    ? { assetDeclarations:    body.assetDeclarations as object }    : {}),
        ...(body.fundingDeclarations  ? { fundingDeclarations:  body.fundingDeclarations as object }  : {}),
        ...(body.socialLinks     ? { socialLinks:     body.socialLinks as object }      : {}),
      },
    })
    return ok(updated, 'Profile updated')
  } catch (e) {
    return handleApiError(e)
  }
}