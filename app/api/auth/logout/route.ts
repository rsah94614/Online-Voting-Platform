// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, clearAuthCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (user) {
    await logAudit({ userId: user.sub, action: AuditAction.USER_LOGOUT, resource: "auth", req });
  }
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
}