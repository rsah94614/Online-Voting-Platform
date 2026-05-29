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
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        user:     { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        party:    { select: { id: true, name: true, abbreviation: true, color: true } },
        nominations: {
          select: {
            election: {
              select: { id: true, title: true, status: true }
            }
          }
        }
      },
    })
    if (!candidate) return notFound()

    // Map candidate fields from bio, manifesto, assetDecl
    const assetDeclObj = candidate.assetDecl && typeof candidate.assetDecl === 'object'
      ? (candidate.assetDecl as Record<string, unknown>)
      : {}

    const mapped = {
      ...candidate,
      biography: candidate.bio,
      election: candidate.nominations[0]?.election || null,
      status: candidate.isApproved ? 'approved' : 'pending',
      ...assetDeclObj,
    }

    return ok(mapped)
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
    const existing = await prisma.candidate.findUnique({ where: { id } })
    if (!existing) return notFound()

    // Allow own candidate or admin
    if (existing.userId !== user.sub && !requireRole(user, Role.ADMIN)) return forbidden()

    const body = updateSchema.parse(await req.json())

    // We store all extra fields in assetDecl JSON
    const currentAssetDecl = existing.assetDecl && typeof existing.assetDecl === 'object'
      ? (existing.assetDecl as Record<string, unknown>)
      : {}

    const updatedAssetDecl = {
      ...currentAssetDecl,
      ...(body.education !== undefined ? { education: body.education } : {}),
      ...(body.workExperience !== undefined ? { workExperience: body.workExperience } : {}),
      ...(body.politicalHistory !== undefined ? { politicalHistory: body.politicalHistory } : {}),
      ...(body.achievements !== undefined ? { achievements: body.achievements } : {}),
      ...(body.keyPolicies !== undefined ? { keyPolicies: body.keyPolicies } : {}),
      ...(body.assetDeclarations !== undefined ? { assetDeclarations: body.assetDeclarations } : {}),
      ...(body.fundingDeclarations !== undefined ? { fundingDeclarations: body.fundingDeclarations } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.socialLinks !== undefined ? { socialLinks: body.socialLinks } : {}),
      ...(body.constituency !== undefined ? { constituency: body.constituency } : {}),
    }

    const updated = await prisma.candidate.update({
      where: { id },
      data: {
        bio: body.biography !== undefined ? body.biography : undefined,
        manifesto: body.manifesto !== undefined ? body.manifesto : undefined,
        assetDecl: updatedAssetDecl,
      },
    })
    return ok(updated, 'Profile updated')
  } catch (e) {
    return handleApiError(e)
  }
}