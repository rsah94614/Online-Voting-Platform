// app/api/parties/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireRole } from '@/lib/auth'
import { ok, created, unauthorized, forbidden, conflict, handleApiError } from '@/lib/response'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()

    const parties = await prisma.party.findMany({
      where: { status: user.role === Role.ADMIN ? undefined : 'ACTIVE' },
      include: {
        _count: { select: { members: true, candidates: true } },
      },
      orderBy: { name: 'asc' },
    })
    return ok(parties)
  } catch (e) {
    return handleApiError(e)
  }
}

const createSchema = z.object({
  name:         z.string().min(2).max(100),
  abbreviation: z.string().min(2).max(6),
  color:        z.string().default('#00d4ff'),
  description:  z.string().optional(),
  ideology:     z.array(z.string()).optional(),
  foundedYear:  z.number().int().optional(),
  website:      z.string().url().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) return unauthorized()
    if (!requireRole(user, Role.ADMIN, Role.PARTY_ADMIN)) return forbidden()

    const body = createSchema.parse(await req.json())

    const existing = await prisma.party.findFirst({
      where: { OR: [{ name: body.name }, { abbreviation: body.abbreviation }] },
    })
    if (existing) return conflict('A party with this name or abbreviation already exists')

    const party = await prisma.party.create({ data: { ...body, ideology: body.ideology ?? [] } })
    return created(party, 'Party registered successfully')
  } catch (e) {
    return handleApiError(e)
  }
}