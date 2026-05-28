// app/api/auth/logout/route.ts
import { clearAuthCookie } from '@/lib/auth'
import { ok } from '@/lib/response'

export async function POST() {
  await clearAuthCookie()
  return ok(null, 'Logged out successfully')
}