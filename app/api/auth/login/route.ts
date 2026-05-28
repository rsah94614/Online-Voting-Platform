// app/api/auth/login/route.ts
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { signToken, setAuthCookie } from '@/lib/auth'
import { ok, badRequest, unauthorized, handleApiError } from '@/lib/response'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const { email, password } = schema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return unauthorized('Invalid email or password')

    const valid = await verifyPassword(password, user.password)
    if (!valid) return unauthorized('Invalid email or password')

    if (!user.isActive) return unauthorized('Account is deactivated. Contact support.')

    const token = await signToken({
      sub:   user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
    })

    await setAuthCookie(token)

    // Audit
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'USER_LOGIN', entity: 'User', entityId: user.id },
    })

    const { password: _, ...safeUser } = user
    return ok({ user: safeUser, token }, 'Login successful')
  } catch (e) {
    return handleApiError(e)
  }
}