// app/api/auth/register/route.ts
import { z } from 'zod'
import { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { signToken, setAuthCookie } from '@/lib/auth'
import { created, badRequest, conflict, handleApiError } from '@/lib/response'

const schema = z.object({
  email:       z.string().email(),
  password:    z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  name:        z.string().min(2),
  phone:       z.string().optional(),
  role:        z.enum(['VOTER', 'CANDIDATE', 'PARTY_ADMIN', 'ADMIN']).default('VOTER'),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  // Voter extras
  address:      z.string().optional(),
  constituency: z.string().optional(),
  // Candidate extras
  electionId:  z.string().optional(),
  partyId:     z.string().optional(),
  biography:   z.string().optional(),
  manifesto:   z.string().optional(),
  // Party admin extras
  partyName:          z.string().optional(),
  partyAbbreviation:  z.string().optional(),
  partyColor:         z.string().optional(),
  partyDescription:   z.string().optional(),
  // Admin auth code
  adminCode: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json())

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } })
    if (existing) return conflict('An account with this email already exists')

    // Admin guard
    if (body.role === 'ADMIN') {
      if (body.adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return badRequest('Invalid admin authorization code')
      }
    }

    const password = await hashPassword(body.password)

    const user = await prisma.user.create({
      data: {
        email:       body.email.toLowerCase(),
        name:        body.name,
        password,
        role:        body.role as Role,
        phone:       body.phone,
        nationality: body.nationality,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        isVerified:  body.role === 'VOTER', // voters auto-verified
      },
    })

    // Role-specific setup
    if (body.role === 'CANDIDATE' && body.electionId) {
      await prisma.candidateProfile.create({
        data: {
          userId:     user.id,
          electionId: body.electionId,
          partyId:    body.partyId ?? null,
          biography:  body.biography,
          manifesto:  body.manifesto,
        },
      })
    }

    if (body.role === 'PARTY_ADMIN' && body.partyName && body.partyAbbreviation) {
      const party = await prisma.party.create({
        data: {
          name:         body.partyName,
          abbreviation: body.partyAbbreviation,
          color:        body.partyColor ?? '#00d4ff',
          description:  body.partyDescription,
        },
      })
      await prisma.partyMember.create({
        data: { userId: user.id, partyId: party.id, role: 'ADMIN' },
      })
    }

    if (body.role === 'VOTER') {
      // If an active election exists, auto-register the voter
      const activeElections = await prisma.election.findMany({
        where: { status: { in: ['UPCOMING', 'LIVE'] } },
        take: 5,
      })
      for (const el of activeElections) {
        await prisma.voterRegistration.create({
          data: { userId: user.id, electionId: el.id, isVerified: true, verifiedAt: new Date() },
        }).catch(() => {})
      }
    }

    const token = await signToken({ sub: user.id, email: user.email, name: user.name, role: user.role })
    await setAuthCookie(token)

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'USER_REGISTERED', entity: 'User', entityId: user.id },
    })

    const { password: _, ...safeUser } = user
    return created({ user: safeUser, token }, 'Account created successfully')
  } catch (e) {
    return handleApiError(e)
  }
}