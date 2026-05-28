// lib/response.ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

type ApiSuccessResponse<T> = { success: true; data: T; message?: string }
type ApiErrorResponse     = { success: false; error: string; details?: unknown }

export function ok<T>(data: T, message?: string, status = 200) {
  const body: ApiSuccessResponse<T> = { success: true, data, ...(message ? { message } : {}) }
  return NextResponse.json(body, { status })
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, 201)
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(error: string, details?: unknown) {
  const body: ApiErrorResponse = { success: false, error, ...(details ? { details } : {}) }
  return NextResponse.json(body, { status: 400 })
}

export function unauthorized(error = 'Unauthorized') {
  return NextResponse.json({ success: false, error }, { status: 401 })
}

export function forbidden(error = 'Forbidden') {
  return NextResponse.json({ success: false, error }, { status: 403 })
}

export function notFound(error = 'Not found') {
  return NextResponse.json({ success: false, error }, { status: 404 })
}

export function conflict(error: string) {
  return NextResponse.json({ success: false, error }, { status: 409 })
}

export function serverError(error: unknown) {
  console.error('[API Error]', error)
  const message = error instanceof Error ? error.message : 'Internal server error'
  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

// ── Zod-aware error handler ───────────────────────────────────────────────────
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return badRequest('Validation failed', error.flatten().fieldErrors)
  }
  return serverError(error)
}

// ── Parse & validate JSON body ────────────────────────────────────────────────
export async function parseBody<T>(req: Request, schema: { parse: (d: unknown) => T }): Promise<T> {
  const raw = await req.json()
  return schema.parse(raw)
}